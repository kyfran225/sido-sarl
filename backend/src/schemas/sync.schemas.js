export const syncBatchSchema = {
  type: 'object',
  properties: {
    batchId: { type: 'string', minLength: 1 },
    transactions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          auditId: { type: 'string', minLength: 1 },
          clientSid: { type: 'string', minLength: 1 },
          amountFCFA: { type: 'number', minimum: 0 },
          litres: { type: 'number', minimum: 0 },
          localTimestamp: { type: 'string', format: 'date-time' },
          deviceId: { type: 'string', minLength: 1 }
        },
        required: ['auditId', 'clientSid', 'amountFCFA', 'localTimestamp', 'deviceId']
      },
      minItems: 1
    }
  },
  required: ['batchId', 'transactions']
};
