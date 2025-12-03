import mongoose from 'mongoose';
import { BON_STATUS } from '../config/constants.js';

const BonSchema = new mongoose.Schema({
  code: { type: String, required: true },
  clientSid: { type: String, required: true },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  montantFCFA: { type: Number, required: true },
  generatedByTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
  status: { type: String, enum: Object.values(BON_STATUS), default: BON_STATUS.AVAILABLE },
  dateGenerated: { type: Date, default: Date.now },
  dateUsed: { type: Date },
  dateExpiry: { type: Date },
  ruleVersion: { type: String }
});

BonSchema.index({ code: 1 }, { unique: true });
BonSchema.index({ clientSid: 1 });
BonSchema.index({ dateExpiry: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: BON_STATUS.EXPIRED } });

const Bon = mongoose.model('Bon', BonSchema);
export default Bon;
