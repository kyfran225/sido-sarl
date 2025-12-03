import mongoose from 'mongoose';

const SyncBatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true },
  deviceId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  result: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

SyncBatchSchema.index({ batchId: 1, deviceId: 1 }, { unique: true });

const SyncBatch = mongoose.model('SyncBatch', SyncBatchSchema);
export default SyncBatch;
