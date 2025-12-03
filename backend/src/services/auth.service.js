import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../config/logger.js';
import auditService from './audit.service.js';

class AuthService {
  async login({ email, password, deviceId }) {
    const user = await User.findOne({ email }).populate('stationId');
    if (!user) throw new Error('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new Error('Invalid credentials');

    const device = user.devices.find(d => d.deviceId === deviceId && !d.revoked);
    if (!device) {
      user.devices.push({ deviceId, lastSeen: new Date(), revoked: false });
      await user.save();
    } else {
      device.lastSeen = new Date();
      await user.save();
    }

    const accessToken = jwt.sign({ sub: user._id, role: user.role, stationId: user.stationId?._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ sub: user._id, deviceId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

    const refreshTokenHash = await bcrypt.hash(refreshToken, Number(process.env.SALT_ROUNDS));
    const deviceToStore = user.devices.find(d => d.deviceId === deviceId);
    deviceToStore.refreshTokenHash = refreshTokenHash;
    await user.save();

    await auditService.log({
      action: 'LOGIN',
      entityType: 'User',
      entityId: user._id.toString(),
      performedBy: user._id,
      deviceId,
      details: { email, stationId: user.stationId?._id }
    });

    logger.info({ userId: user._id, deviceId }, 'Login successful');

    return { accessToken, refreshToken, user: { id: user._id, name: user.name, email: user.email, role: user.role, stationId: user.stationId?._id } };
  }

  async refresh({ refreshToken, deviceId }) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const user = await User.findById(decoded.sub);
      if (!user) throw new Error('User not found');

      const device = user.devices.find(d => d.deviceId === deviceId && !d.revoked);
      if (!device) throw new Error('Device not found or revoked');

      const valid = await bcrypt.compare(refreshToken, device.refreshTokenHash);
      if (!valid) throw new Error('Invalid refresh token');

      const newAccessToken = jwt.sign({ sub: user._id, role: user.role, stationId: user.stationId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
      const newRefreshToken = jwt.sign({ sub: user._id, deviceId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN });

      const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, Number(process.env.SALT_ROUNDS));
      device.refreshTokenHash = newRefreshTokenHash;
      device.lastSeen = new Date();
      await user.save();

      await auditService.log({
        action: 'TOKEN_REFRESH',
        entityType: 'User',
        entityId: user._id.toString(),
        performedBy: user._id,
        deviceId,
        details: { stationId: user.stationId }
      });

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new Error('Invalid refresh token');
    }
  }

  async logout({ userId, deviceId }) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const device = user.devices.find(d => d.deviceId === deviceId);
    if (device) {
      device.revoked = true;
      device.refreshTokenHash = undefined;
      await user.save();
    }

    await auditService.log({
      action: 'LOGOUT',
      entityType: 'User',
      entityId: userId,
      performedBy: userId,
      deviceId,
      details: {}
    });

    logger.info({ userId, deviceId }, 'Logout successful');
  }

  async hashPassword(password) {
    return bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
  }
}

export default new AuthService();
