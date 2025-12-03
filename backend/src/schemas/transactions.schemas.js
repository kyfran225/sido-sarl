export const createTransactionSchema = {
  type: 'object',
  properties: {
    auditId: { type: 'string', minLength: 1 },
    clientSid: { type: 'string', pattern: '^SIDO-' },
    amountFCFA: { type: 'number', minimum: 0 },
    litres: { type: 'number', minimum: 0 },
    localTimestamp: { type: 'string', format: 'date-time' },
    deviceId: { type: 'string', minLength: 1 }
  },
  required: ['auditId', 'clientSid', 'amountFCFA', 'localTimestamp', 'deviceId'],
  additionalProperties: false
};

export const batchTransactionItemSchema = {
  type: 'object',
  properties: {
    auditId: { type: 'string', minLength: 1 },
    clientSid: { type: 'string' },
    amountFCFA: { type: 'number' },
    litres: { type: 'number', minimum: 0 },
    localTimestamp: { type: 'string', format: 'date-time' },
    deviceId: { type: 'string', minLength: 1 }
  },
  required: ['auditId', 'clientSid', 'amountFCFA', 'localTimestamp', 'deviceId'],
  additionalProperties: false
};

export const createBatchTransactionsSchema = {
  type: 'object',
  properties: {
    transactions: {
      type: 'array',
      items: batchTransactionItemSchema,
      minItems: 1
    }
  },
  required: ['transactions'],
  additionalProperties: false
};
