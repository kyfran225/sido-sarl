export const createStationSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    location: { type: 'string', minLength: 1 },
    managerId: { type: 'string', minLength: 1 }
  },
  required: ['name', 'location']
};

export const updateStationSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    location: { type: 'string', minLength: 1 },
    managerId: { type: 'string', minLength: 1 },
    isActive: { type: 'boolean' }
  }
};

export const createUserSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3 },
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 6 },
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: ['pompiste', 'manager', 'admin'] },
    stationId: { type: 'string', minLength: 1 }
  },
  required: ['username', 'email', 'password', 'firstName', 'lastName', 'role']
};

export const updateUserSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3 },
    email: { type: 'string', format: 'email' },
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    role: { type: 'string', enum: ['pompiste', 'manager', 'admin'] },
    stationId: { type: 'string', minLength: 1 },
    isActive: { type: 'boolean' }
  }
};

export const createRuleSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { type: 'string', enum: ['fixed', 'threshold', 'percentage'] },
    conditions: { type: 'object' },
    rewards: { type: 'object' },
    isActive: { type: 'boolean' },
    priority: { type: 'number', minimum: 0 }
  },
  required: ['name', 'type', 'conditions', 'rewards']
};

export const updateRuleSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', minLength: 1 },
    type: { type: 'string', enum: ['fixed', 'threshold', 'percentage'] },
    conditions: { type: 'object' },
    rewards: { type: 'object' },
    isActive: { type: 'boolean' },
    priority: { type: 'number', minimum: 0 }
  }
};
