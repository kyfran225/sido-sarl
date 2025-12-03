import cron from 'node-cron';
import Bon from '../models/bon.model.js';
import logger from '../config/logger.js';

/**
 * Job to expire bons that have reached their expiry date
 * Runs daily at 2 AM
 */
export const expireBonsJob = () => {
  // Run daily at 2 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('Starting bon expiration job');

      const now = new Date();
      
      // Find and update expired bons
      const result = await Bon.updateMany(
        {
          status: 'available',
          dateExpiry: { $lt: now }
        },
        {
          $set: { 
            status: 'expired',
            dateUsed: now // Optional: set dateUsed to expiry date
          }
        }
      );

      if (result.modifiedCount > 0) {
        logger.info(`Expired ${result.modifiedCount} bons`);
      } else {
        logger.info('No bons to expire');
      }

    } catch (error) {
      logger.error({ err: error }, 'Error in bon expiration job');
    }
  });

  logger.info('Bon expiration job scheduled (daily at 2 AM)');
};

/**
 * Manual function to expire bons (for testing or one-time execution)
 */
export const expireBonsManually = async () => {
  try {
    logger.info('Manually expiring bons');

    const now = new Date();
    
    const result = await Bon.updateMany(
      {
        status: 'available',
        dateExpiry: { $lt: now }
      },
      {
        $set: { 
          status: 'expired',
          dateUsed: now
        }
      }
    );

    logger.info(`Manually expired ${result.modifiedCount} bons`);
    return result;

  } catch (error) {
    logger.error({ err: error }, 'Error in manual bon expiration');
    throw error;
  }
};

export default expireBonsJob;
