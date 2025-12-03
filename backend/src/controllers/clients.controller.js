import Client from '../models/client.model.js';
import Points from '../models/points.model.js';
import { generateSid } from '../services/sid.service.js';
import { createAuditLog } from '../services/audit.service.js';
import { listBonsForClient } from '../services/bon.service.js';
import logger from '../config/logger.js';

/**
 * Creates a new client with generated SID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const createClient = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, segment, stationEnrolment } = req.body;
    const user = req.user;

    // Generate SID
    const sid = await generateSid(stationEnrolment || user.stationId);

    // Create client
    const client = new Client({
      sid,
      firstName,
      lastName,
      phone,
      segment: segment || 'general',
      stationEnrolement: stationEnrolment || user.stationId
    });

    await client.save();

    // Create points document
    const points = new Points({ clientSid: sid });
    await points.save();

    // Audit log
    await createAuditLog({
      action: 'CLIENT_CREATED',
      entity: 'Client',
      entityId: client._id,
      user: { id: user._id, name: user.name, role: user.role },
      metadata: { sid, phone, stationId: user.stationId }
    });

    res.status(201).json({
      client: {
        sid: client.sid,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        segment: client.segment,
        stationEnrolement: client.stationEnrolement,
        createdAt: client.createdAt
      },
      pointsTotal: 0
    });
  } catch (error) {
    logger.error({ err: error, body: req.body }, 'Create client error');
    next(error);
  }
};

/**
 * Gets client by SID with points and bons
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const getClientBySid = async (req, res, next) => {
  try {
    const { sid } = req.params;

    const client = await Client.findOne({ sid });
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get points
    const points = await Points.findOne({ clientSid: sid }).lean();

    // Get available bons
    const bons = await listBonsForClient(sid, { status: 'available', limit: 10 });

    res.json({
      client: {
        sid: client.sid,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        segment: client.segment,
        stationEnrolement: client.stationEnrolement,
        createdAt: client.createdAt
      },
      points: {
        totalPoints: points ? points.totalPoints : 0,
        lastUpdated: points ? points.lastUpdated : null,
        history: points ? points.pointsHistory.slice(-5) : []
      },
      bonsDisponibles: bons
    });
  } catch (error) {
    logger.error({ err: error, sid: req.params.sid }, 'Get client error');
    next(error);
  }
};

/**
 * Searches clients by phone or name
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const searchClients = async (req, res, next) => {
  try {
    const { q, limit = 20 } = req.query;
    const user = req.user;

    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    // Search by phone or name, restricted to user's station
    const clients = await Client.find({
      stationEnrolement: user.stationId,
      $or: [
        { phone: new RegExp(q, 'i') },
        { firstName: new RegExp(q, 'i') },
        { lastName: new RegExp(q, 'i') }
      ]
    })
    .limit(parseInt(limit))
    .lean();

    res.json({ clients });
  } catch (error) {
    logger.error({ err: error, query: req.query }, 'Search clients error');
    next(error);
  }
};
