import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../src/loaders/app.js';
import User from '../src/models/user.model.js';
import Client from '../src/models/client.model.js';
import Station from '../src/models/station.model.js';
import Transaction from '../src/models/transaction.model.js';
import Points from '../src/models/points.model.js';

// Mock JWT for testing
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn()
}));

describe('Transactions API Integration Tests', () => {
  let testUser;
  let testClient;
  let testStation;
  let authToken;

  beforeAll(async () => {
    // Increase timeout to 30 seconds for this hook
    jest.setTimeout(30000);
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sido-test');

    // Create test data
    testStation = new Station({
      name: 'Test Station',
      code: 'TS-001',
      address: 'Test Address'
    });
    await testStation.save();

    testUser = new User({
      name: 'Test Pompiste',
      email: 'pompiste@test.com',
      passwordHash: 'hashedpassword',
      role: 'pompiste',
      stationId: testStation._id
    });
    await testUser.save();

    testClient = new Client({
      sid: 'SIDO-TS001-000001',
      firstName: 'Test',
      lastName: 'Client',
      phone: '+2250100000000',
      stationEnrolement: testStation._id
    });
    await testClient.save();

    // Mock JWT to return valid userId
    jwt.verify.mockReturnValue({ userId: testUser._id.toString() });

    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    // Clean up
    await Transaction.deleteMany({});
    await Points.deleteMany({});
    await Client.deleteMany({});
    await User.deleteMany({});
    await Station.deleteMany({});
    await mongoose.disconnect();
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction successfully', async () => {
      const transactionData = {
        auditId: 'test-audit-123',
        clientSid: testClient.sid,
        amountFCFA: 15000,
        litres: 12.5,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('transactionId');
      expect(response.body).toHaveProperty('pointsAwarded');
      expect(response.body).toHaveProperty('pointsTotalClient');
      expect(response.body).toHaveProperty('serverTimestamp');
    });

    it('should return duplicate response for same auditId', async () => {
      const transactionData = {
        auditId: 'test-audit-duplicate',
        clientSid: testClient.sid,
        amountFCFA: 10000,
        litres: 8.0,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      // First request
      await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      // Second request with same auditId
      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'duplicate');
      expect(response.body).toHaveProperty('existing');
    });

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        auditId: 'test-invalid',
        clientSid: 'invalid-sid',
        amountFCFA: -1000, // Invalid amount
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 without authentication', async () => {
      const transactionData = {
        auditId: 'test-no-auth',
        clientSid: testClient.sid,
        amountFCFA: 15000,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .send(transactionData);

      expect(response.status).toBe(401);
    });

    it('should return 400 for client not found', async () => {
      const transactionData = {
        auditId: 'test-client-not-found',
        clientSid: 'NONEXISTENT-SID',
        amountFCFA: 15000,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
    });

    it('should handle zero amount transaction', async () => {
      const transactionData = {
        auditId: 'test-zero-amount',
        clientSid: testClient.sid,
        amountFCFA: 0,
        litres: 0,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('pointsAwarded', 0);
    });

    it('should handle very large amount transaction', async () => {
      const transactionData = {
        auditId: 'test-large-amount',
        clientSid: testClient.sid,
        amountFCFA: 10000000, // 10 million FCFA
        litres: 8000,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('pointsAwarded', 10000); // 10000000 / 1000 = 10000
    });

    it('should return 400 for negative amount', async () => {
      const transactionData = {
        auditId: 'test-negative-amount',
        clientSid: testClient.sid,
        amountFCFA: -1000,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('should handle transaction with no active rule (warning expected)', async () => {
      // Create a client with a segment that has no rules
      const noRuleClient = new Client({
        sid: 'SIDO-NORULE-000001',
        firstName: 'No',
        lastName: 'Rule',
        phone: '+2250100000001',
        segment: 'norule', // Segment with no rules
        stationEnrolement: testStation._id
      });
      await noRuleClient.save();

      const transactionData = {
        auditId: 'test-no-rule',
        clientSid: noRuleClient.sid,
        amountFCFA: 15000,
        localTimestamp: new Date().toISOString(),
        deviceId: 'device-test-001'
      };

      const response = await request(app)
        .post('/api/transactions')
        .set('Authorization', authToken)
        .send(transactionData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('pointsAwarded', 15); // Still calculates points
      // Warning should be logged about no active rule

      // Clean up
      await Client.deleteMany({ sid: noRuleClient.sid });
    });
  });

  describe('POST /api/transactions/batch', () => {
    it('should handle batch with mixed valid and invalid transactions', async () => {
      const batchData = [
        // Valid transaction
        {
          auditId: 'batch-valid-1',
          clientSid: testClient.sid,
          amountFCFA: 10000,
          localTimestamp: new Date().toISOString(),
          deviceId: 'device-batch-001'
        },
        // Invalid: client not found
        {
          auditId: 'batch-invalid-1',
          clientSid: 'INVALID-SID',
          amountFCFA: 5000,
          localTimestamp: new Date().toISOString(),
          deviceId: 'device-batch-002'
        },
        // Invalid: negative amount
        {
          auditId: 'batch-invalid-2',
          clientSid: testClient.sid,
          amountFCFA: -2000,
          localTimestamp: new Date().toISOString(),
          deviceId: 'device-batch-003'
        },
        // Valid transaction
        {
          auditId: 'batch-valid-2',
          clientSid: testClient.sid,
          amountFCFA: 20000,
          localTimestamp: new Date().toISOString(),
          deviceId: 'device-batch-004'
        }
      ];

      const response = await request(app)
        .post('/api/transactions/batch')
        .set('Authorization', authToken)
        .send({ transactions: batchData });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accepted');
      expect(response.body).toHaveProperty('rejected');
      expect(response.body).toHaveProperty('duplicates');

      expect(response.body.accepted).toHaveLength(2);
      expect(response.body.rejected).toHaveLength(2);
      expect(response.body.duplicates).toHaveLength(0);
    });

    it('should return 400 for empty batch', async () => {
      const response = await request(app)
        .post('/api/transactions/batch')
        .set('Authorization', authToken)
        .send({ transactions: [] });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 400 for batch exceeding max size', async () => {
      const largeBatch = Array(250).fill().map((_, i) => ({
        auditId: `large-batch-${i}`,
        clientSid: testClient.sid,
        amountFCFA: 1000,
        localTimestamp: new Date().toISOString(),
        deviceId: `device-${i}`
      }));

      const response = await request(app)
        .post('/api/transactions/batch')
        .set('Authorization', authToken)
        .send({ transactions: largeBatch });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Batch size exceeds maximum');
    });
  });
});
