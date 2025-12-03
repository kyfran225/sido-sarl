import mongoose from 'mongoose';

const ClientSchema = new mongoose.Schema({
  sid: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String },
  phone: { type: String, required: true },
  segment: { type: String, default: 'general' },
  stationEnrolement: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

ClientSchema.index({ sid: 1 }, { unique: true });
ClientSchema.index({ phone: 1 });
ClientSchema.index({ stationEnrolement: 1 });

ClientSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Client = mongoose.model('Client', ClientSchema);
export default Client;
