import { jest } from '@jest/globals';
import { calculatePointsAwarded, processBonusForTransaction, generateBons } from '../src/services/bonus.service.js';
import Client from '../src/models/client.model.js';

// Mock the models
jest.mock('../src/models/rule.model.js');
jest.mock('../src/models/client.model.js');

const Rule = require('../src/models/rule.model.js');

describe('Bonus Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePointsAwarded', () => {
    it('should calculate points based on amount (1 point per 1000 FCFA)', () => {
      const amountFCFA = 15000;
      const expectedPoints = 15; // 15000 / 1000 = 15

      const result = calculatePointsAwarded(amountFCFA);

      expect(result).toBe(expectedPoints);
    });

    it('should return 0 for amount less than 1000 FCFA', () => {
      const amountFCFA = 500;
      const expectedPoints = 0;

      const result = calculatePointsAwarded(amountFCFA);

      expect(result).toBe(expectedPoints);
    });

    it('should handle decimal amounts by flooring', () => {
      const amountFCFA = 2500;
      const expectedPoints = 2; // Math.floor(2500 / 1000) = 2

      const result = calculatePointsAwarded(amountFCFA);

      expect(result).toBe(expectedPoints);
    });
  });

  describe('processBonusForTransaction', () => {
    it('should process bonus and generate bons when threshold is reached', async () => {
      const clientSid = 'SID001';
      const amountFCFA = 15000;
      const mockTransaction = { _id: 'txn123', auditId: 'TXN001', stationId: 'station123' };

      // Mock client lookup
      Client.findOne.mockResolvedValue({
        sid: clientSid,
        segment: 'standard'
      });

      // Mock rule lookup
      Rule.default.findOne.mockResolvedValue({
        name: 'Test Rule',
        version: '1.0.0',
        thresholdToBonus: [
          { threshold: 10, rewardType: 'amount', rewardValue: 500, expiryDays: 30 }
        ]
      });

      const result = await processBonusForTransaction(clientSid, amountFCFA, mockTransaction);

      expect(result.pointsAwarded).toBe(15);
      expect(result.generatedBons).toHaveLength(1);
      expect(result.generatedBons[0].montantFCFA).toBe(500);
    });

    it('should not generate bons when threshold is not reached', async () => {
      const clientSid = 'SID001';
      const amountFCFA = 5000;
      const mockTransaction = { _id: 'txn123', auditId: 'TXN001', stationId: 'station123' };

      // Mock client lookup
      Client.findOne.mockResolvedValue({
        sid: clientSid,
        segment: 'standard'
      });

      // Mock rule lookup
      Rule.default.findOne.mockResolvedValue({
        name: 'Test Rule',
        version: '1.0.0',
        thresholdToBonus: [
          { threshold: 10000, rewardType: 'amount', rewardValue: 500, expiryDays: 30 }
        ]
      });

      const result = await processBonusForTransaction(clientSid, amountFCFA, mockTransaction);

      expect(result.pointsAwarded).toBe(5);
      expect(result.generatedBons).toHaveLength(0);
    });

    it('should handle new clients with zero points', async () => {
      const clientSid = 'SID001';
      const amountFCFA = 5000;
      const mockTransaction = { _id: 'txn123', auditId: 'TXN001', stationId: 'station123' };

      // Mock client lookup
      Client.findOne.mockResolvedValue({
        sid: clientSid,
        segment: 'standard'
      });

      // Mock rule lookup
      Rule.default.findOne.mockResolvedValue({
        name: 'Test Rule',
        version: '1.0.0',
        thresholdToBonus: [
          { threshold: 10000, rewardType: 'amount', rewardValue: 500, expiryDays: 30 }
        ]
      });

      const result = await processBonusForTransaction(clientSid, amountFCFA, mockTransaction);

      expect(result.pointsAwarded).toBe(5);
      expect(result.generatedBons).toHaveLength(0);
    });
  });

  describe('generateBons', () => {
    it('should generate bons based on rule thresholds', () => {
      const rule = {
        thresholdToBonus: [
          { threshold: 10000, rewardType: 'amount', rewardValue: 500, expiryDays: 30 },
          { threshold: 25000, rewardType: 'amount', rewardValue: 1500, expiryDays: 30 }
        ]
      };
      const totalPoints = 15000;
      const clientSid = 'SID001';
      const stationId = 'station123';
      const transaction = { _id: 'txn123', auditId: 'TXN001' };

      const bons = generateBons(rule, totalPoints, clientSid, stationId, transaction);

      expect(bons).toHaveLength(1);
      expect(bons[0].montantFCFA).toBe(500);
      expect(bons[0].clientSid).toBe(clientSid);
      expect(bons[0].stationId).toBe(stationId);
    });

    it('should generate multiple bons for multiple thresholds', () => {
      const rule = {
        thresholdToBonus: [
          { threshold: 5000, rewardType: 'amount', rewardValue: 200, expiryDays: 30 },
          { threshold: 10000, rewardType: 'amount', rewardValue: 500, expiryDays: 30 },
          { threshold: 25000, rewardType: 'amount', rewardValue: 1500, expiryDays: 30 }
        ]
      };
      const totalPoints = 30000;
      const clientSid = 'SID001';
      const stationId = 'station123';
      const transaction = { _id: 'txn123', auditId: 'TXN001' };

      const bons = generateBons(rule, totalPoints, clientSid, stationId, transaction);

      expect(bons).toHaveLength(3);
      expect(bons[0].montantFCFA).toBe(200);
      expect(bons[1].montantFCFA).toBe(500);
      expect(bons[2].montantFCFA).toBe(1500);
    });

    it('should return empty array when no thresholds reached', () => {
      const rule = {
        thresholdToBonus: [
          { threshold: 10000, rewardType: 'amount', rewardValue: 500, expiryDays: 30 }
        ]
      };
      const totalPoints = 5000;
      const clientSid = 'SID001';
      const stationId = 'station123';
      const transaction = { _id: 'txn123', auditId: 'TXN001' };

      const bons = generateBons(rule, totalPoints, clientSid, stationId, transaction);

      expect(bons).toHaveLength(0);
    });
  });
});
