import mongoose from 'mongoose';

const ThresholdSchema = new mongoose.Schema({
  threshold: { type: Number, required: true },
  rewardType: { type: String, enum: ['amount', 'percent'], default: 'amount' },
  rewardValue: { type: Number, required: true },
  expiryDays: { type: Number, default: 30 }
}, { _id: false });

const RuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  version: { type: String, required: true },
  effectiveFrom: { type: Date, required: true },
  segment: { type: String, required: true },
  pointsPerTransaction: { type: Number, default: 1 },
  thresholdToBonus: { type: [ThresholdSchema], default: [] },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

RuleSchema.index({ segment: 1, effectiveFrom: -1 });
RuleSchema.index({ name: 1, version: 1 }, { unique: true });

const Rule = mongoose.model('Rule', RuleSchema);
export default Rule;
