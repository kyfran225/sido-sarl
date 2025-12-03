import Points from '../models/points.model.js';
import logger from '../config/logger.js';

/**
 * Gets current points snapshot for a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getPoints = async (req, res, next) => {
  try {
    const { sid } = req.params;

    const points = await Points.findOne({ clientSid: sid }).lean();

    if (!points) {
      return res.status(404).json({ error: 'Points record not found for client' });
    }

    res.json({
      clientSid: points.clientSid,
      totalPoints: points.totalPoints,
      lastUpdated: points.lastUpdated,
      recentHistory: points.pointsHistory.slice(-10) // Last 10 transactions
    });
  } catch (error) {
    logger.error({ err: error, sid: req.params.sid }, 'Get points error');
    next(error);
  }
};

/**
 * Gets full points history for a client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getPointsHistory = async (req, res, next) => {
  try {
    const { sid } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const points = await Points.findOne({ clientSid: sid }).lean();

    if (!points) {
      return res.status(404).json({ error: 'Points record not found for client' });
    }

    const history = points.pointsHistory
      .sort((a, b) => new Date(b.date) - new Date(a.date)) // Most recent first
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

    res.json({
      clientSid: points.clientSid,
      totalPoints: points.totalPoints,
      history,
      pagination: {
        total: points.pointsHistory.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  } catch (error) {
    logger.error({ err: error, sid: req.params.sid }, 'Get points history error');
    next(error);
  }
};
