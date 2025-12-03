import { listBonsForClient, useBon } from '../services/bon.service.js';
import logger from '../config/logger.js';

/**
 * List bons for authenticated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listBons = async (req, res) => {
  try {
    const { user } = req;

    const bons = await listBonsForClient(user._id);

    res.json({
      success: true,
      data: bons
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user._id }, 'List bons failed');
    res.status(500).json({
      success: false,
      error: { message: 'Failed to list bons' }
    });
  }
};

/**
 * Use a bon
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const useBonHandler = async (req, res) => {
  try {
    const { code } = req.params;
    const { user } = req;

    const result = await useBon(code, user);

    logger.info({
      bonCode: code,
      userId: user._id,
      stationId: user.stationId
    }, 'Bon used successfully');

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error({
      err: error,
      bonCode: req.params.code,
      userId: req.user._id
    }, 'Use bon failed');

    const statusCode = error.message.includes('not found') ? 404 :
                      error.message.includes('already used') ? 400 :
                      error.message.includes('expired') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: { message: error.message }
    });
  }
};
