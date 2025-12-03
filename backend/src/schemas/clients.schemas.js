export const createClientSchema = {
  type: 'object',
  properties: {
    firstName: { type: 'string', minLength: 1 },
    lastName: { type: 'string', minLength: 1 },
    phone: { type: 'string', minLength: 1 },
    segment: { type: 'string', enum: ['general', 'premium', 'vip'] },
    stationEnrolment: { type: 'string', minLength: 1 }
  },
  required: ['firstName', 'lastName', 'phone'],
  additionalProperties: false
};
