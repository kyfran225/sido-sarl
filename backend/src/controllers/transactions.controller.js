import { createTransaction, createBatchTransactions } from '../services/transaction.service.js';
import { createAuditLog } from '../services/audit.service.js';
import logger from '../config/logger.js';

/**
 * Handles single transaction creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const createTransactionHandler = async (req, res, next) => {
  try {
    const {
      auditId,
      clientSid,
      amountFCFA,
      litres,
      localTimestamp,
      deviceId
    } = req.body;

    const user = req.user;

    // Create transaction
    const result = await createTransaction({
      auditId,
      clientSid,
      stationId: user.stationId,
      pompisteId: user._id,
      deviceId,
      localTimestamp: new Date(localTimestamp),
      amountFCFA,
      litres
    });

    // Audit log
    await createAuditLog({
      action: 'TRANSACTION_CREATED',
      entity: 'Transaction',
      entityId: result.transaction._id,
      user: { id: user._id, name: user.name, role: user.role },
      metadata: {
        auditId,
        clientSid,
        amountFCFA,
        pointsAwarded: result.pointsAwarded,
        deviceId
      }
    });

    res.status(201).json({
      transactionId: result.transaction._id,
      auditId: result.transaction.auditId,
      pointsAwarded: result.pointsAwarded,
      pointsTotalClient: result.pointsTotalClient,
      bonGenerated: result.bonGenerated,
      serverTimestamp: result.transaction.serverTimestamp
    });
  } catch (error) {
    if (error.message === 'Duplicate transaction') {
      // Return existing transaction data
      const existing = error.existingTransaction;
      return res.status(200).json({
        message: 'duplicate',
        existing: {
          transactionId: existing._id,
          auditId: existing.auditId,
          pointsAwarded: existing.pointsAwarded,
          serverTimestamp: existing.serverTimestamp
        }
      });
    }

    logger.error({ err: error, body: req.body }, 'Create transaction error');
    next(error);
  }
};

/**
 * Handles batch transaction creation
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const createBatchTransactionsHandler = async (req, res, next) => {
  try {
    const { transactions } = req.body;
    const user = req.user;

    // Validate batch size
    const BATCH_MAX_SIZE = parseInt(process.env.BATCH_MAX_SIZE) || 200;
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        error: 'Transactions array is required',
        code: 'INVALID_PAYLOAD'
      });
    }

    if (transactions.length > BATCH_MAX_SIZE) {
      return res.status(400).json({
        error: `Batch size exceeds maximum of ${BATCH_MAX_SIZE} transactions`,
        code: 'BATCH_TOO_LARGE'
      });
    }

    // Process batch
    const result = await createBatchTransactions(transactions, user);

    // Audit log for batch operation
    await createAuditLog({
      action: 'TRANSACTION_BATCH_CREATED',
      entity: 'Transaction',
      entityId: null, // Batch operation
      user: { id: user._id, name: user.name, role: user.role },
      metadata: {
        totalTransactions: transactions.length,
        acceptedCount: result.accepted.length,
        rejectedCount: result.rejected.length,
        duplicatesCount: result.duplicates.length
      }
    });

    res.status(200).json({
      accepted: result.accepted,
      rejected: result.rejected,
      duplicates: result.duplicates
    });

  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Batch transactions error');
    next(error);
  }
};
