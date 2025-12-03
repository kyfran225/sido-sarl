import mongoose from 'mongoose';

const PointsSchema = new mongoose.Schema({
  clientSid: { type: String, required: true },
  totalPoints: { type: Number, default: 0 },
  pointsHistory: [{
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    points: Number,
    date: Date
  }],
  lastUpdated: { type: Date, default: Date.now }
});

PointsSchema.index({ clientSid: 1 }, { unique: true });

const Points = mongoose.model('Points', PointsSchema);
export default Points;
