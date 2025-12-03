import Transaction from '../models/transaction.model.js';
import Station from '../models/station.model.js';
import logger from '../config/logger.js';

/**
 * Generate station report with performance metrics
 * @param {string} stationId - Station ObjectId
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @returns {Promise<Object>} Report data
 */
export const generateStationReport = async (stationId, startDate, endDate) => {
  try {
    // Verify station exists
    const station = await Station.findById(stationId);
    if (!station) {
      throw new Error('Station not found');
    }

    // Build match conditions
    const matchConditions = {
      stationId: stationId,
      status: 'synced'
    };

    if (startDate && endDate) {
      matchConditions.serverTimestamp = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Aggregate transaction data
    const aggregates = await Transaction.aggregate([
      {
        $match: matchConditions
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
          averageTransactionValue: {
            $cond: {
              if: { $gt: ['$totalTransactions', 0] },
              then: { $divide: ['$totalAmountFCFA', '$totalTransactions'] },
              else: 0
            }
          }
        }
      },
      {
        $sort: { date: 1 }
      }
    ]);

    // Calculate summary statistics
    const summary = aggregates.reduce(
      (acc, day) => {
        acc.totalTransactions += day.totalTransactions;
        acc.totalAmountFCFA += day.totalAmountFCFA;
        acc.totalLitres += day.totalLitres;
        acc.totalPointsAwarded += day.totalPointsAwarded;
        acc.totalUniqueClients += day.uniqueClientsCount;
        return acc;
      },
      {
        totalTransactions: 0,
        totalAmountFCFA: 0,
        totalLitres: 0,
        totalPointsAwarded: 0,
        totalUniqueClients: 0
      }
    );

    // Add overall averages
    summary.averageTransactionValue = summary.totalTransactions > 0
      ? summary.totalAmountFCFA / summary.totalTransactions
      : 0;

    summary.averageLitresPerTransaction = summary.totalTransactions > 0
      ? summary.totalLitres / summary.totalTransactions
      : 0;

    const report = {
      stationId: station._id,
      stationName: station.name,
      stationCode: station.code,
      period: {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null
      },
      summary,
      dailyData: aggregates,
      generatedAt: new Date().toISOString()
    };

    logger.info({
      stationId,
      totalTransactions: summary.totalTransactions,
      totalAmountFCFA: summary.totalAmountFCFA
    }, 'Generated station report');

    return report;

  } catch (error) {
    logger.error({ err: error, stationId, startDate, endDate }, 'Failed to generate station report');
    throw error;
  }
};

/**
 * Generate global report across all stations
 * @param {Date} startDate - Start date (optional)
 * @param {Date} endDate - End date (optional)
 * @returns {Promise<Object>} Global report data
 */
export const generateGlobalReport = async (startDate, endDate) => {
  try {
    // Build match conditions
    const matchConditions = {
      status: 'synced'
    };

    if (startDate && endDate) {
      matchConditions.serverTimestamp = {
        $gte: startDate,
        $lte: endDate
      };
    }

    // Aggregate transaction data across all stations
    const aggregates = await Transaction.aggregate([
      {
        $match: matchConditions
      },
      {
        $group: {
          _id: {
            stationId: '$stationId',
            date: {
              $dateToString: { format: '%Y-%m-%d', date: '$serverTimestamp' }
            }
          },
          totalTransactions: { $sum: 1 },
          totalAmountFCFA: { $sum: '$amountFCFA' },
          totalLitres: { $sum: '$litres' },
          totalPointsAwarded: { $sum: '$pointsAwarded' },
          uniqueClients: { $addToSet: '$clientSid' }
        }
      },
      {
        $group: {
          _id: '$_id.stationId',
          dailyData: {
            $push: {
              date: '$_id.date',
              totalTransactions: '$totalTransactions',
              totalAmountFCFA: '$totalAmountFCFA',
              totalLitres: '$totalLitres',
              totalPointsAwarded: '$totalPointsAwarded',
              uniqueClientsCount: { $size: '$uniqueClients' },
              averageTransactionValue: {
                $cond: {
                  if: { $gt: ['$totalTransactions', 0] },
                  then: { $divide: ['$totalAmountFCFA', '$totalTransactions'] },
                  else: 0
                }
              }
            }
          },
          summary: {
            $mergeObjects: {
              totalTransactions: { $sum: '$totalTransactions' },
              totalAmountFCFA: { $sum: '$totalAmountFCFA' },
              totalLitres: { $sum: '$totalLitres' },
              totalPointsAwarded: { $sum: '$totalPointsAwarded' },
              totalUniqueClients: { $sum: { $size: '$uniqueClients' } }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'stations',
          localField: '_id',
          foreignField: '_id',
          as: 'station'
        }
      },
      {
        $unwind: '$station'
      },
      {
        $project: {
          stationId: '$_id',
          stationName: '$station.name',
          stationCode: '$station.code',
          summary: {
            totalTransactions: '$summary.totalTransactions',
            totalAmountFCFA: '$summary.totalAmountFCFA',
            totalLitres: '$summary.totalLitres',
            totalPointsAwarded: '$summary.totalPointsAwarded',
            totalUniqueClients: '$summary.totalUniqueClients',
            averageTransactionValue: {
              $cond: {
                if: { $gt: ['$summary.totalTransactions', 0] },
                then: { $divide: ['$summary.totalAmountFCFA', '$summary.totalTransactions'] },
                else: 0
              }
            },
            averageLitresPerTransaction: {
              $cond: {
                if: { $gt: ['$summary.totalTransactions', 0] },
                then: { $divide: ['$summary.totalLitres', '$summary.totalTransactions'] },
                else: 0
              }
            }
          },
          dailyData: {
            $sortArray: { input: '$dailyData', sortBy: { date: 1 } }
          }
        }
      },
      {
        $sort: { stationName: 1 }
      }
    ]);

    // Calculate global summary
    const globalSummary = aggregates.reduce(
      (acc, station) => {
        acc.totalStations += 1;
        acc.totalTransactions += station.summary.totalTransactions;
        acc.totalAmountFCFA += station.summary.totalAmountFCFA;
        acc.totalLitres += station.summary.totalLitres;
        acc.totalPointsAwarded += station.summary.totalPointsAwarded;
        acc.totalUniqueClients += station.summary.totalUniqueClients;
        return acc;
      },
      {
        totalStations: 0,
        totalTransactions: 0,
        totalAmountFCFA: 0,
        totalLitres: 0,
        totalPointsAwarded: 0,
        totalUniqueClients: 0
      }
    );

    // Add global averages
    globalSummary.averageTransactionValue = globalSummary.totalTransactions > 0
      ? globalSummary.totalAmountFCFA / globalSummary.totalTransactions
      : 0;

    globalSummary.averageLitresPerTransaction = globalSummary.totalTransactions > 0
      ? globalSummary.totalLitres / globalSummary.totalTransactions
      : 0;

    const report = {
      period: {
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null
      },
      globalSummary,
      stations: aggregates,
      generatedAt: new Date().toISOString()
    };

    logger.info({
      totalStations: globalSummary.totalStations,
      totalTransactions: globalSummary.totalTransactions,
      totalAmountFCFA: globalSummary.totalAmountFCFA
    }, 'Generated global report');

    return report;

  } catch (error) {
    logger.error({ err: error, startDate, endDate }, 'Failed to generate global report');
    throw error;
  }
};

/**
 * Convert report data to CSV format
 * @param {Object} report - Report data
 * @returns {string} CSV content
 */
export const convertReportToCSV = (report) => {
  const lines = [];

  // Header
  lines.push('Station Report');
  lines.push(`Station: ${report.stationName} (${report.stationCode})`);
  lines.push(`Period: ${report.period.startDate || 'All time'} to ${report.period.endDate || 'Present'}`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');

  // Summary
  lines.push('Summary');
  lines.push(`Total Transactions,${report.summary.totalTransactions}`);
  lines.push(`Total Amount (FCFA),${report.summary.totalAmountFCFA}`);
  lines.push(`Total Litres,${report.summary.totalLitres}`);
  lines.push(`Total Points Awarded,${report.summary.totalPointsAwarded}`);
  lines.push(`Unique Clients,${report.summary.totalUniqueClients}`);
  lines.push(`Average Transaction Value (FCFA),${report.summary.averageTransactionValue.toFixed(2)}`);
  lines.push(`Average Litres per Transaction,${report.summary.averageLitresPerTransaction.toFixed(2)}`);
  lines.push('');

  // Daily data header
  lines.push('Daily Data');
  lines.push('Date,Transactions,Amount FCFA,Litres,Points Awarded,Unique Clients,Avg Transaction Value');

  // Daily data rows
  report.dailyData.forEach(day => {
    lines.push([
      day.date,
      day.totalTransactions,
      day.totalAmountFCFA,
      day.totalLitres || 0,
      day.totalPointsAwarded,
      day.uniqueClientsCount,
      day.averageTransactionValue.toFixed(2)
    ].join(','));
  });

  return lines.join('\n');
};
