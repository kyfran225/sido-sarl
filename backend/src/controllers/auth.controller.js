import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import logger from '../config/logger.js';
import { createAuditLog } from '../services/audit.service.js';

/**
 * Login user and return tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const login = async (req, res) => {
  try {
    const { username, password, deviceId } = req.body;

    const user = await User.findOne({ username }).populate('stationId');
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Update device ID
    user.deviceId = deviceId;
    await user.save();

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Audit log
    await createAuditLog({
      action: 'LOGIN',
      userId: user._id,
      stationId: user.stationId,
      deviceId,
      details: { username: user.username }
    });

    logger.info({ userId: user._id, username: user.username }, 'User logged in');

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          stationId: user.stationId
        }
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Login failed');
    res.status(500).json({
      success: false,
      error: { message: 'Login failed' }
    });
  }
};

/**
 * Refresh access token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid refresh token' }
      });
    }

    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({
      success: true,
      data: { accessToken }
    });
  } catch (error) {
    logger.error({ err: error }, 'Token refresh failed');
    res.status(401).json({
      success: false,
      error: { message: 'Invalid refresh token' }
    });
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const logout = async (req, res) => {
  try {
    const { user } = req;

    // Clear device ID
    await User.findByIdAndUpdate(user._id, { deviceId: null });

    // Audit log
    await createAuditLog({
      action: 'LOGOUT',
      userId: user._id,
      stationId: user.stationId,
      deviceId: user.deviceId,
      details: { username: user.username }
    });

    logger.info({ userId: user._id }, 'User logged out');

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user._id }, 'Logout failed');
    res.status(500).json({
      success: false,
      error: { message: 'Logout failed' }
    });
  }
};

/**
 * Revoke device access
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const revokeDevice = async (req, res) => {
  try {
    const { deviceId } = req.body;
    const { user } = req;

    if (user.role !== 'admin' && user.deviceId !== deviceId) {
      return res.status(403).json({
        success: false,
        error: { message: 'Cannot revoke other devices' }
      });
    }

    const targetUser = user.role === 'admin' ?
      await User.findOne({ deviceId }) :
      user;

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: { message: 'Device not found' }
      });
    }

    targetUser.deviceId = null;
    await targetUser.save();

    // Audit log
    await createAuditLog({
      action: 'DEVICE_REVOKE',
      userId: user._id,
      stationId: user.stationId,
      deviceId,
      details: { targetUserId: targetUser._id }
    });

    logger.info({ userId: user._id, deviceId }, 'Device revoked');

    res.json({
      success: true,
      message: 'Device access revoked'
    });
  } catch (error) {
    logger.error({ err: error, userId: req.user._id }, 'Device revoke failed');
    res.status(500).json({
      success: false,
      error: { message: 'Device revoke failed' }
    });
  }
};
