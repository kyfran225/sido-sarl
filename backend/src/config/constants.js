export const ROLES = {
  POMPISTE: 'pompiste',
  MANAGER: 'manager',
  ADMIN: 'admin'
};

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SYNCED: 'synced',
  REJECTED: 'rejected'
};

export const BON_STATUS = {
  AVAILABLE: 'available',
  USED: 'used',
  EXPIRED: 'expired'
};

export const ERROR_CODES = {
  BAD_PAYLOAD: 'BAD_PAYLOAD',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  BUSINESS_RULE: 'BUSINESS_RULE_VIOLATION',
  RATE_LIMIT: 'RATE_LIMITED'
};

export const DEFAULT_SEGMENT = 'general';
export const DEFAULT_POINTS_PER_TRANSACTION = 1;
