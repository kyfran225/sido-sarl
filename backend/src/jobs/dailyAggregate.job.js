import Transaction from '../models/transaction.model.js';
import logger from '../config/logger.js';

/**
 * Generate daily KPI aggregates for stations
 * Should be run nightly via cron
 */
export const generateDailyAggregates = async (date = new Date()) => {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Aggregate transactions by station
    const stationAggregates = await Transaction.aggregate([
      {
        $match: {
          serverTimestamp: { $gte: startOfDay, $lte: endOfDay },
          status: 'synced'
        }
      },
      {
        $group: {
          _id: '$stationId',
          totalTransactions: { $sum: 1 },
          totalAmountFCFA: { $sum: '$amountFCFA' },
          totalLitres: { $sum: '$litres' },
          totalPointsAwarded: { $sum: '$pointsAwarded' },
          uniqueClients: { $addToSet: '$clientSid' }
        }
      },
      {
        $project: {
          stationId: '$_id',
          totalTransactions: 1,
          totalAmountFCFA: 1,
          totalLitres: 1,
          totalPointsAwarded: 1,
          uniqueClientsCount: { $size: '$uniqueClients' }
        }
      }
    ]);

    // Aggregate by pompiste
    const pompisteAggregates = await Transaction.aggregate([
      {
        $match: {
          serverTimestamp: { $gte: startOfDay, $lte: endOfDay },
          status: 'synced'
        }
      },
      {
        $group: {
          _id: '$pompisteId',
          totalTransactions: { $sum: 1 },
          totalAmountFCFA: { $sum: '$amountFCFA' },
          totalLitres: { $sum: '$litres' },
          totalPointsAwarded: { $sum: '$pointsAwarded' }
        }
      }
    ]);

    const results = {
      date: startOfDay.toISOString().split('T')[0],
      stations: stationAggregates,
      pompistes: pompisteAggregates
    };

    logger.info({
      date: results.date,
      stationCount: results.stations.length,
      pompisteCount: results.pompistes.length
    }, 'Generated daily aggregates');

    return results;

  } catch (error) {
    logger.error({ err: error, date }, 'Failed to generate daily aggregates');
    throw error;
  }
};

/**
 * Get station performance metrics for a date range
 * @param {string} stationId - Station ObjectId
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Object>} Performance metrics
 */
export const getStationPerformance = async (stationId, startDate, endDate) => {
  try {
    const aggregates = await Transaction.aggregate([
      {
        $match: {
          stationId: stationId,
          serverTimestamp: { $gte: startDate, $lte: endDate },
          status: 'synced'
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$serverTimestamp' }
          },
          totalTransactions: { $sum: 1 },
          totalAmountFCFA: { $sum: '$amountFCFA' },
          totalLitres: { $sum: '$litres' },
          totalPointsAwarded: { $sum: '$pointsAwarded' },
          uniqueClients: { $addToSet: '$clientSid' }
        }
      },
      {
        $project: {
          date: '$_id',
          totalTransactions: 1,
          totalAmountFCFA: 1,
          totalLitres: 1,
          totalPointsAwarded: 1,
          uniqueClientsCount: { $size: '$uniqueClients' },
          averageTransactionValue: { $divide: ['$totalAmountFCFA', '$totalTransactions'] }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    return aggregates;

  } catch (error) {
    logger.error({ err: error, stationId, startDate, endDate }, 'Failed to get station performance');
    throw error;
  }
};
