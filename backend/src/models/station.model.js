import mongoose from 'mongoose';

const StationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  address: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

StationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Station = mongoose.model('Station', StationSchema);
export default Station;
