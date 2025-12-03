import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import app from '../src/loaders/app.js';
import User from '../src/models/user.model.js';
import Station from '../src/models/station.model.js';
import Transaction from '../src/models/transaction.model.js';

// Mock JWT for testing
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn()
}));

describe('Reports API Integration Tests', () => {
  let testUser;
  let testStation;
  let authToken;

  beforeAll(async () => {
    jest.setTimeout(30000);
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/sido-test');

    // Create test data
    testStation = new Station({
      name: 'Test Station',
      code: 'TS-001',
      address: 'Test Address'
    });
    await testStation.save();

    testUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      passwordHash: 'hashedpassword',
      role: 'admin',
      stationId: testStation._id
    });
    await testUser.save();

    // Mock JWT to return valid userId
    jwt.verify.mockReturnValue({ userId: testUser._id.toString() });

    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Station.deleteMany({});
    await mongoose.disconnect();
  });

  describe('GET /api/reports', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reports');

      expect(response.status).toBe(401);
    });

    it('should return reports data with authentication', async () => {
      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('globalSummary');
      expect(response.body.data).toHaveProperty('stations');
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data).toHaveProperty('generatedAt');
    });

    it('should return reports with date range filtering', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/reports?from=${startDate}&to=${endDate}`)
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('period');
      expect(response.body.data.period.startDate).toBe(startDate);
      expect(response.body.data.period.endDate).toBe(endDate);
    });

    it('should return 400 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/reports?from=invalid-date')
        .set('Authorization', authToken);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Invalid date format');
    });

    it('should handle reports with no data (empty database)', async () => {
      // Clean up existing data
      await Transaction.deleteMany({});

      const response = await request(app)
        .get('/api/reports')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.globalSummary.totalTransactions).toBe(0);
      expect(response.body.data.stations).toHaveLength(0);
    });

    it('should return 400 for CSV export request (not supported)', async () => {
      const response = await request(app)
        .get('/api/reports?format=csv')
        .set('Authorization', authToken);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('CSV export not supported');
    });
  });
});
