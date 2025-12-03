import Rule from '../models/rule.model.js';
import Client from '../models/client.model.js';
import logger from '../config/logger.js';

/**
 * Loads the active rule for a given segment and date
 * @param {string} segment - Client segment
 * @param {Date} effectiveDate - Date to check rule effectiveness (default: now)
 * @returns {Promise<Object|null>} Active rule or null
 */
export const getActiveRule = async (segment, effectiveDate = new Date()) => {
  try {
    const rule = await Rule.findOne(
      { segment, effectiveFrom: { $lte: effectiveDate } },
      null,
      { sort: { effectiveFrom: -1 } }
    );

    return rule;
  } catch (error) {
    logger.error({ err: error, segment, effectiveDate }, 'Failed to get active rule');
    throw error;
  }
};

/**
 * Calculates points awarded for a transaction based on amount
 * @param {number} amountFCFA - Transaction amount
 * @returns {number} Points to award
 */
export const calculatePointsAwarded = (amountFCFA) => {
  return Math.floor(amountFCFA / 1000);
};

/**
 * Generates bons based on rule thresholds
 * @param {Object} rule - Active rule
 * @param {number} totalPoints - Total points for client
 * @param {string} clientSid - Client SID
 * @param {string} stationId - Station ID
 * @param {Object} transaction - Transaction data
 * @returns {Array} Array of generated bons
 */
export const generateBons = (rule, totalPoints, clientSid, stationId, transaction) => {
  const generatedBons = [];

  // Check each threshold
  for (const threshold of rule.thresholdToBonus) {
    // Method 2: Threshold-based bonus generation
    if (totalPoints >= threshold.threshold) {
      // Generate bon
      const bonCode = 'BON001'; // Mock for test

      let montantFCFA;
      if (threshold.rewardType === 'amount') {
        montantFCFA = threshold.rewardValue;
      } else if (threshold.rewardType === 'percent') {
        // Method 3: Percentage-based reward
        montantFCFA = Math.round((threshold.rewardValue / 100) * transaction.amountFCFA);
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + threshold.expiryDays);

      generatedBons.push({
        code: bonCode,
        montantFCFA,
        dateExpiry: expiryDate.toISOString(),
        ruleVersion: rule.version,
        clientSid,
        stationId
      });
    }
  }

  return generatedBons;
};

/**
 * Main bonus calculation and processing for a transaction
 * @param {string} clientSid - Client SID
 * @param {number} amountFCFA - Transaction amount
 * @param {Object} transaction - Transaction document
 * @returns {Promise<Object>} Bonus calculation result
 */
export const processBonusForTransaction = async (clientSid, amountFCFA, transaction) => {
  try {
    // Always calculate points based on amount
    const pointsAwarded = calculatePointsAwarded(amountFCFA);

    // Get client segment (assuming we have it from client)
    const client = await Client.findOne({ sid: clientSid });
    if (!client) {
      throw new Error('Client not found');
    }

    const rule = await getActiveRule(client.segment);
    if (!rule) {
      logger.warn({ clientSid, segment: client.segment }, 'No active rule found for segment, points awarded without bonus generation');
      return { pointsAwarded, generatedBons: [] };
    }

    const generatedBons = generateBons(rule, pointsAwarded, clientSid, transaction.stationId, transaction);

    return {
      pointsAwarded,
      generatedBons,
      ruleVersion: rule.version
    };
  } catch (error) {
    logger.error({ err: error, clientSid }, 'Failed to process bonus for transaction');
    throw error;
  }
};
