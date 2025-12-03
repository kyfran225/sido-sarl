import mongoose from 'mongoose';
import { ROLES } from '../config/constants.js';

const DeviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  lastSeen: { type: Date, default: Date.now },
  revoked: { type: Boolean, default: false },
  refreshTokenHash: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String },
  role: { type: String, enum: Object.values(ROLES), default: ROLES.POMPISTE },
  stationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Station' },
  passwordHash: { type: String, required: true },
  devices: { type: [DeviceSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

UserSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model('User', UserSchema);
export default User;
