import mongoose from 'mongoose';
import { TRANSACTION_STATUS } from '../config/constants.js';

const TransactionSchema = new mongoose.Schema({
  auditId: { type: String, required: true },
  clientSid: { type: String, required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  pompisteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String, required: true },
  localTimestamp: { type: Date, required: true },
  serverTimestamp: { type: Date, default: Date.now },
  amountFCFA: { type: Number, required: true },
  litres: { type: Number },
  pointsAwarded: { type: Number, default: 0 },
  status: { type: String, enum: Object.values(TRANSACTION_STATUS), default: TRANSACTION_STATUS.PENDING },
  reasonRejected: { type: String },
  batchId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

TransactionSchema.index({ auditId: 1 }, { unique: true });
TransactionSchema.index({ clientSid: 1 });
TransactionSchema.index({ stationId: 1, serverTimestamp: -1 });

const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;
