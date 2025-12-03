import mongoose from 'mongoose';
import SyncBatch from '../models/sync-batch.model.js';
import { createTransaction } from './transaction.service.js';
import logger from '../config/logger.js';

/**
 * Process batch sync transactions
 * @param {string} batchId - Batch identifier
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} user - User performing the sync
 * @returns {Object} Sync results
 */
export const processBatchSync = async (batchId, transactions, user) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if batch already processed
    const existingBatch = await SyncBatch.findOne({ batchId }).session(session);
    if (existingBatch) {
      await session.abortTransaction();
      return {
        accepted: [],
        rejected: transactions.map(tx => ({
          auditId: tx.auditId,
          reason: 'Batch already processed'
        })),
        generatedBons: []
      };
    }

    const accepted = [];
    const rejected = [];
    const generatedBons = [];

    // Process each transaction
    for (const txData of transactions) {
      try {
        const result = await createTransaction({
          ...txData,
          stationId: user.stationId,
          pompisteId: user._id,
          batchId
        }, session);

        accepted.push({
          auditId: txData.auditId,
          transactionId: result.transaction._id,
          pointsAwarded: result.pointsAwarded
        });

        if (result.generatedBon) {
          generatedBons.push(result.generatedBon);
        }
      } catch (error) {
        logger.warn({
          err: error,
          auditId: txData.auditId,
          batchId
        }, 'Transaction rejected in batch sync');

        rejected.push({
          auditId: txData.auditId,
          reason: error.message
        });
      }
    }

    // Create batch record
    await SyncBatch.create([{
      batchId,
      stationId: user.stationId,
      userId: user._id,
      totalTransactions: transactions.length,
      acceptedCount: accepted.length,
      rejectedCount: rejected.length,
      generatedBonsCount: generatedBons.length
    }], { session });

    await session.commitTransaction();

    logger.info({
      batchId,
      accepted: accepted.length,
      rejected: rejected.length,
      generatedBons: generatedBons.length
    }, 'Batch sync completed successfully');

    return {
      accepted,
      rejected,
      generatedBons
    };

  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    logger.error({ err: error, batchId }, 'Batch sync failed');
    throw error;
  } finally {
    session.endSession();
  }
};
