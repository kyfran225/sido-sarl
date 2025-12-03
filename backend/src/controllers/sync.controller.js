import { processBatchSync } from '../services/sync.service.js';
import logger from '../config/logger.js';

/**
 * Handle batch sync request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const syncBatchHandler = async (req, res) => {
  try {
    const { batchId, transactions } = req.body;
    const { user } = req;

    logger.info({
      batchId,
      transactionCount: transactions.length,
      userId: user._id,
      stationId: user.stationId
    }, 'Processing batch sync');

    const result = await processBatchSync(batchId, transactions, user);

    logger.info({
      batchId,
      accepted: result.accepted.length,
      rejected: result.rejected.length,
      generatedBons: result.generatedBons.length
    }, 'Batch sync completed');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({ err: error, batchId: req.body.batchId }, 'Batch sync failed');
    res.status(500).json({
      success: false,
      error: { message: 'Batch sync failed' }
    });
  }
};
