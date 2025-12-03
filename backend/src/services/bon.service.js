import Bon from '../models/bon.model.js';
import Counter from '../models/counter.model.js';
import logger from '../config/logger.js';

/**
 * Generates a unique bon code using atomic counter
 * Format: BR-YYYYMMDD-XXXXXX
 * @returns {Promise<string>} Unique bon code
 */
export const generateBonCode = async () => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const counterId = `bon-${dateStr}`;

    // Atomic increment
    const counter = await Counter.findOneAndUpdate(
      { _id: counterId },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );

    const seqStr = counter.seq.toString().padStart(6, '0');
    const code = `BR-${dateStr}-${seqStr}`;

    return code;
  } catch (error) {
    logger.error({ err: error }, 'Failed to generate bon code');
    throw error;
  }
};

/**
 * Validates and uses a bon
 * @param {string} code - Bon code
 * @param {string} stationId - Station ID
 * @param {string} deviceId - Device ID
 * @param {Object} user - User performing the action
 * @returns {Promise<Object>} Bon usage result
 */
export const useBon = async (code, stationId, deviceId, user) => {
  try {
    const bon = await Bon.findOne({ code, status: 'available' });

    if (!bon) {
      throw new Error('Bon not found or not available');
    }

    if (bon.dateExpiry && new Date() > bon.dateExpiry) {
      bon.status = 'expired';
      await bon.save();
      throw new Error('Bon has expired');
    }

    // Update bon status
    bon.status = 'used';
    bon.dateUsed = new Date();
    bon.stationId = stationId; // Associate with usage station

    await bon.save();

    logger.info({
      code,
      clientSid: bon.clientSid,
      stationId,
      deviceId,
      userId: user.id
    }, 'Bon used successfully');

    return {
      code: bon.code,
      status: bon.status,
      clientSid: bon.clientSid,
      montantFCFA: bon.montantFCFA,
      dateUsed: bon.dateUsed
    };
  } catch (error) {
    logger.error({ err: error, code, stationId, deviceId }, 'Failed to use bon');
    throw error;
  }
};

/**
 * Lists bons for a client
 * @param {string} clientSid - Client SID
 * @param {Object} options - Query options
 * @returns {Promise<Array>} List of bons
 */
export const listBonsForClient = async (clientSid, options = {}) => {
  try {
    const { status, limit = 50 } = options;

    const query = { clientSid };
    if (status) query.status = status;

    const bons = await Bon.find(query)
      .sort({ dateGenerated: -1 })
      .limit(limit)
      .populate('stationId', 'name code')
      .lean();

    return bons;
  } catch (error) {
    logger.error({ err: error, clientSid, options }, 'Failed to list bons for client');
    throw error;
  }
};
