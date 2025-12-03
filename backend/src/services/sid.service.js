import Counter from '../models/counter.model.js';
import Station from '../models/station.model.js';
import logger from '../config/logger.js';

/**
 * Generates a unique SIDO-ID for a client
 * Format: SIDO-<stationCode>-<paddedSeq>
 * @param {string} stationId - Station ObjectId
 * @returns {Promise<string>} Generated SID
 */
export const generateSid = async (stationId) => {
  try {
    // Get station code
    const station = await Station.findById(stationId);
    if (!station) {
      throw new Error('Station not found');
    }

    // Atomically increment counter for this station
    const counter = await Counter.findOneAndUpdate(
      { _id: `sid_${station.code}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );

    // Format SID: SIDO-<stationCode>-<6-digit padded seq>
    const paddedSeq = counter.seq.toString().padStart(6, '0');
    const sid = `SIDO-${station.code}-${paddedSeq}`;

    logger.info({ stationId, stationCode: station.code, seq: counter.seq, sid }, 'Generated new SID');

    return sid;
  } catch (error) {
    logger.error({ err: error, stationId }, 'Failed to generate SID');
    throw error;
  }
};
