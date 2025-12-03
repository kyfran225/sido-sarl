import Transaction from '../models/transaction.model.js';
import Points from '../models/points.model.js';
import Client from '../models/client.model.js';
import { processBonusForTransaction } from './bonus.service.js';
import logger from '../config/logger.js';

/**
 * Creates a new transaction with points calculation and bonus generation
 * @param {Object} transactionData - Transaction data
 * @param {string} transactionData.auditId - Unique audit ID
 * @param {string} transactionData.clientSid - Client SID
 * @param {string} transactionData.stationId - Station ObjectId
 * @param {string} transactionData.pompisteId - Pompiste ObjectId
 * @param {string} transactionData.deviceId - Device ID
 * @param {Date} transactionData.localTimestamp - Local timestamp
 * @param {number} transactionData.amountFCFA - Amount in FCFA
 * @param {number} transactionData.litres - Litres (optional)
 * @returns {Promise<Object>} Transaction creation result
 */
export const createTransaction = async (transactionData) => {
  const session = await Transaction.startSession();
  session.startTransaction();

  try {
    const {
      auditId,
      clientSid,
      stationId,
      pompisteId,
      deviceId,
      localTimestamp,
      amountFCFA,
      litres
    } = transactionData;

    // Check for duplicate auditId
    const existingTransaction = await Transaction.findOne({ auditId }).session(session);
    if (existingTransaction) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();

      // Get current points total for the client
      const pointsDoc = await Points.findOne({ clientSid });
      const pointsTotalClient = pointsDoc ? pointsDoc.totalPoints : 0;

      const error = new Error('Duplicate transaction');
      error.existingTransaction = {
        ...existingTransaction.toObject(),
        pointsTotalClient
      };
      throw error;
    }

    // Verify client exists
    const client = await Client.findOne({ sid: clientSid }).session(session);
    if (!client) {
      throw new Error('Client not found');
    }

    // Create transaction
    const transaction = new Transaction({
      auditId,
      clientSid,
      stationId,
      pompisteId,
      deviceId,
      localTimestamp,
      amountFCFA,
      litres,
      status: 'synced'
    });

    await transaction.save({ session });

    // Process bonus calculation and generation
    const bonusResult = await processBonusForTransaction(clientSid, amountFCFA, transaction);

    // Update points snapshot
    const pointsUpdate = {
      $inc: { totalPoints: bonusResult.pointsAwarded },
      $push: {
        pointsHistory: {
          transactionId: transaction._id,
          points: bonusResult.pointsAwarded,
          date: new Date()
        }
      },
      $set: { lastUpdated: new Date() }
    };

    // Limit history to last 100 entries
    pointsUpdate.$push.pointsHistory.$slice = -100;

    await Points.findOneAndUpdate(
      { clientSid },
      pointsUpdate,
      { upsert: true, new: true, session }
    );

    // Get updated points total
    const updatedPoints = await Points.findOne({ clientSid }).session(session);
    const pointsTotalClient = updatedPoints ? updatedPoints.totalPoints : bonusResult.pointsAwarded;

    await session.commitTransaction();
    session.endSession();

    logger.info({
      transactionId: transaction._id,
      auditId,
      clientSid,
      pointsAwarded: bonusResult.pointsAwarded,
      pointsTotalClient,
      bonGenerated: bonusResult.generatedBons.length > 0
    }, 'Transaction created successfully');

    return {
      transaction,
      pointsAwarded: bonusResult.pointsAwarded,
      pointsTotalClient,
      bonGenerated: bonusResult.generatedBons.length > 0 ? bonusResult.generatedBons[0] : null
    };

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();

    if (error.existingTransaction) {
      throw error; // Re-throw duplicate error
    }

    logger.error({ err: error, transactionData }, 'Failed to create transaction');
    throw error;
  }
};

/**
 * Validates transaction data for batch processing
 * @param {Object} transactionData - Transaction data
 * @returns {string|null} Validation error message or null if valid
 */
const validateTransactionData = (transactionData) => {
  const { auditId, clientSid, amountFCFA, litres, localTimestamp, deviceId } = transactionData;

  if (!auditId || typeof auditId !== 'string' || auditId.trim().length === 0) {
    return 'Invalid auditId';
  }

  if (!clientSid || typeof clientSid !== 'string' || !/^SIDO-/.test(clientSid)) {
    return 'Invalid clientSid format';
  }

  if (typeof amountFCFA !== 'number' || amountFCFA < 0) {
    return 'Invalid amountFCFA: must be a non-negative number';
  }

  if (litres !== undefined && (typeof litres !== 'number' || litres < 0)) {
    return 'Invalid litres: must be a non-negative number';
  }

  if (!localTimestamp) {
    return 'Missing localTimestamp';
  }

  if (!deviceId || typeof deviceId !== 'string' || deviceId.trim().length === 0) {
    return 'Invalid deviceId';
  }

  return null; // Valid
};

/**
 * Creates multiple transactions in batch with points calculation and bonus generation
 * @param {Array} transactions - Array of transaction data objects
 * @param {Object} user - User object (pompiste)
 * @returns {Promise<Object>} Batch processing result
 */
export const createBatchTransactions = async (transactions, user) => {
  const accepted = [];
  const rejected = [];
  const duplicates = [];

  // Step 1: Validate all transactions and collect valid ones
  const validationResults = transactions.map(transactionData => {
    const validationError = validateTransactionData(transactionData);
    if (validationError) {
      rejected.push({
        auditId: transactionData.auditId,
        reason: validationError
      });
      return null;
    }
    return transactionData;
  }).filter(Boolean);

  // Step 2: Check for existing transactions (duplicates) in batch
  const auditIds = validationResults.map(t => t.auditId);
  const existingTransactions = await Transaction.find({ auditId: { $in: auditIds } })
    .select('auditId pointsAwarded serverTimestamp')
    .lean();

  const existingMap = new Map(existingTransactions.map(t => [t.auditId, t]));

  // Separate duplicates and valid non-duplicates
  const nonDuplicateTransactions = [];
  for (const transactionData of validationResults) {
    if (existingMap.has(transactionData.auditId)) {
      const existing = existingMap.get(transactionData.auditId);
      duplicates.push({
        auditId: transactionData.auditId,
        reason: 'Duplicate transaction',
        existing: {
          transactionId: existing._id,
          auditId: existing.auditId,
          pointsAwarded: existing.pointsAwarded,
          serverTimestamp: existing.serverTimestamp
        }
      });
    } else {
      nonDuplicateTransactions.push(transactionData);
    }
  }

  if (nonDuplicateTransactions.length === 0) {
    // No valid non-duplicate transactions to process
    logger.info({
      totalProcessed: transactions.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      duplicatesCount: duplicates.length
    }, 'Batch transactions processed (no inserts needed)');

    return { accepted, rejected, duplicates };
  }

  // Step 3: Verify clients exist for valid transactions
  const clientSids = [...new Set(nonDuplicateTransactions.map(t => t.clientSid))];
  const existingClients = await Client.find({ sid: { $in: clientSids } })
    .select('sid')
    .lean();
  const existingClientSids = new Set(existingClients.map(c => c.sid));

  const clientVerifiedTransactions = [];
  for (const transactionData of nonDuplicateTransactions) {
    if (!existingClientSids.has(transactionData.clientSid)) {
      rejected.push({
        auditId: transactionData.auditId,
        reason: 'Client not found'
      });
    } else {
      clientVerifiedTransactions.push(transactionData);
    }
  }

  if (clientVerifiedTransactions.length === 0) {
    // No transactions with valid clients
    logger.info({
      totalProcessed: transactions.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      duplicatesCount: duplicates.length
    }, 'Batch transactions processed (no valid clients)');

    return { accepted, rejected, duplicates };
  }

  // Step 4: Build bulk insert operations
  const bulkOps = clientVerifiedTransactions.map(transactionData => ({
    insertOne: {
      document: {
        auditId: transactionData.auditId,
        clientSid: transactionData.clientSid,
        stationId: user.stationId,
        pompisteId: user._id,
        deviceId: transactionData.deviceId,
        localTimestamp: new Date(transactionData.localTimestamp),
        amountFCFA: transactionData.amountFCFA,
        litres: transactionData.litres,
        status: 'synced'
      }
    }
  }));

  // Step 5: Execute bulk write
  let bulkResult;
  try {
    bulkResult = await Transaction.bulkWrite(bulkOps, { ordered: false });
  } catch (bulkError) {
    logger.error({ err: bulkError }, 'Bulk write failed');
    // If bulk write fails completely, reject all remaining transactions
    for (const transactionData of clientVerifiedTransactions) {
      rejected.push({
        auditId: transactionData.auditId,
        reason: 'Bulk insert failed'
      });
    }

    logger.info({
      totalProcessed: transactions.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      duplicatesCount: duplicates.length
    }, 'Batch transactions processed (bulk write failed)');

    return { accepted, rejected, duplicates };
  }

  // Step 6: Process bulk write result
  const insertedIds = bulkResult.result.insertedIds || {};
  const insertedCount = bulkResult.result.nInserted || 0;

  // Handle write errors (duplicates that slipped through)
  if (bulkResult.result.writeErrors && bulkResult.result.writeErrors.length > 0) {
    for (const writeError of bulkResult.result.writeErrors) {
      const failedOp = bulkOps[writeError.index];
      const auditId = failedOp.insertOne.document.auditId;

      if (writeError.code === 11000) { // Duplicate key error
        // Find existing transaction
        const existing = await Transaction.findOne({ auditId })
          .select('auditId pointsAwarded serverTimestamp')
          .lean();
        if (existing) {
          duplicates.push({
            auditId,
            reason: 'Duplicate transaction',
            existing: {
              transactionId: existing._id,
              auditId: existing.auditId,
              pointsAwarded: existing.pointsAwarded,
              serverTimestamp: existing.serverTimestamp
            }
          });
        }
      } else {
        rejected.push({
          auditId,
          reason: `Insert failed: ${writeError.errmsg}`
        });
      }
    }
  }

  // Step 7: Process points and bonuses for successful inserts
  for (let i = 0; i < clientVerifiedTransactions.length; i++) {
    const transactionData = clientVerifiedTransactions[i];
    const insertedId = insertedIds[i];

    if (!insertedId) continue; // Skip if not inserted

    try {
      // Get the inserted transaction
      const transaction = await Transaction.findById(insertedId);
      if (!transaction) continue;

      // Process bonus calculation and generation
      const bonusResult = await processBonusForTransaction(transaction.clientSid, transaction.amountFCFA, transaction);

      // Update points snapshot
      const pointsUpdate = {
        $inc: { totalPoints: bonusResult.pointsAwarded },
        $push: {
          pointsHistory: {
            transactionId: transaction._id,
            points: bonusResult.pointsAwarded,
            date: new Date()
          }
        },
        $set: { lastUpdated: new Date() }
      };

      // Limit history to last 100 entries
      pointsUpdate.$push.pointsHistory.$slice = -100;

      await Points.findOneAndUpdate(
        { clientSid: transaction.clientSid },
        pointsUpdate,
        { upsert: true, new: true }
      );

      // Get updated points total
      const updatedPoints = await Points.findOne({ clientSid: transaction.clientSid });
      const pointsTotalClient = updatedPoints ? updatedPoints.totalPoints : bonusResult.pointsAwarded;

      accepted.push({
        transactionId: transaction._id,
        auditId: transaction.auditId,
        pointsAwarded: bonusResult.pointsAwarded,
        pointsTotalClient,
        bonGenerated: bonusResult.generatedBons.length > 0 ? bonusResult.generatedBons[0] : null,
        serverTimestamp: transaction.serverTimestamp
      });

    } catch (error) {
      logger.error({ err: error, transactionId: insertedId, auditId: transactionData.auditId }, 'Failed to process bonus for inserted transaction');
      // Transaction was inserted but bonus processing failed - still count as accepted but log error
      const transaction = await Transaction.findById(insertedId);
      if (transaction) {
        accepted.push({
          transactionId: transaction._id,
          auditId: transaction.auditId,
          pointsAwarded: 0, // Default if bonus processing failed
          pointsTotalClient: 0,
          bonGenerated: null,
          serverTimestamp: transaction.serverTimestamp
        });
      }
    }
  }

  logger.info({
    totalProcessed: transactions.length,
    acceptedCount: accepted.length,
    rejectedCount: rejected.length,
    duplicatesCount: duplicates.length,
    bulkInserted: insertedCount
  }, 'Batch transactions processed with bulkWrite');

  return {
    accepted,
    rejected,
    duplicates
  };
};
