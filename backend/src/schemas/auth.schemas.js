export const loginSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 1 },
    password: { type: 'string', minLength: 1 },
    deviceId: { type: 'string', minLength: 1 }
  },
  required: ['username', 'password', 'deviceId'],
  additionalProperties: false
};

export const refreshTokenSchema = {
  type: 'object',
  properties: {
    refreshToken: { type: 'string', minLength: 1 }
  },
  required: ['refreshToken'],
  additionalProperties: false
};

export const revokeDeviceSchema = {
  type: 'object',
  properties: {
    deviceId: { type: 'string', minLength: 1 }
  },
  required: ['deviceId'],
  additionalProperties: false
};
