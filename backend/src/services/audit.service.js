import AuditLog from '../models/audit-log.model.js';
import logger from '../config/logger.js';

/**
 * Creates an immutable audit log entry
 * @param {Object} auditData - Audit data to log
 * @param {string} auditData.action - The action performed (e.g., 'CREATE_TRANSACTION', 'LOGIN')
 * @param {string} auditData.entity - The entity type (e.g., 'Transaction', 'User')
 * @param {string} auditData.entityId - The ID of the entity
 * @param {Object} auditData.user - User performing the action (id, name, role)
 * @param {Object} auditData.changes - Changes made (for updates)
 * @param {Object} auditData.metadata - Additional metadata (deviceId, stationId, etc.)
 * @returns {Promise<Object>} The created audit log
 */
export const createAuditLog = async (auditData) => {
  try {
    const auditLog = new AuditLog({
      action: auditData.action,
      entityType: auditData.entity,
      entityId: auditData.entityId,
      performedBy: auditData.user?.id,
      deviceId: auditData.metadata?.deviceId,
      details: auditData.metadata
    });

    await auditLog.save();
    logger.info({
      action: auditData.action,
      entityType: auditData.entity,
      entityId: auditData.entityId
    }, 'Audit log created');

    return auditLog;
  } catch (error) {
    logger.error({ err: error, auditData }, 'Failed to create audit log');
    // Don't throw - audit logging should not break business logic
  }
};

/**
 * Retrieves audit logs with filtering and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Pagination and sorting options
 * @returns {Promise<Object>} Paginated audit logs
 */
export const getAuditLogs = async (filters = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 50,
      sort = { timestamp: -1 }
    } = options;

    const query = {};

    if (filters.action) query.action = filters.action;
    if (filters.entity) query.entity = filters.entity;
    if (filters.userId) query['user.id'] = filters.userId;
    if (filters.stationId) query['metadata.stationId'] = filters.stationId;
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    logger.error({ err: error, filters, options }, 'Failed to retrieve audit logs');
    throw error;
  }
};
