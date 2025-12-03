import Station from '../models/station.model.js';
import User from '../models/user.model.js';
import Rule from '../models/rule.model.js';
import logger from '../config/logger.js';

// Station CRUD
export const getStations = async (req, res) => {
  try {
    const stations = await Station.find().populate('managerId', 'firstName lastName');
    res.json({ success: true, data: stations });
  } catch (error) {
    logger.error({ err: error }, 'Get stations failed');
    res.status(500).json({ success: false, error: { message: 'Failed to get stations' } });
  }
};

export const createStation = async (req, res) => {
  try {
    const station = new Station(req.body);
    await station.save();
    logger.info({ stationId: station._id }, 'Station created');
    res.status(201).json({ success: true, data: station });
  } catch (error) {
    logger.error({ err: error }, 'Create station failed');
    res.status(500).json({ success: false, error: { message: 'Failed to create station' } });
  }
};

export const updateStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!station) {
      return res.status(404).json({ success: false, error: { message: 'Station not found' } });
    }
    res.json({ success: true, data: station });
  } catch (error) {
    logger.error({ err: error, stationId: req.params.id }, 'Update station failed');
    res.status(500).json({ success: false, error: { message: 'Failed to update station' } });
  }
};

export const deleteStation = async (req, res) => {
  try {
    const station = await Station.findByIdAndDelete(req.params.id);
    if (!station) {
      return res.status(404).json({ success: false, error: { message: 'Station not found' } });
    }
    res.json({ success: true, data: station });
  } catch (error) {
    logger.error({ err: error, stationId: req.params.id }, 'Delete station failed');
    res.status(500).json({ success: false, error: { message: 'Failed to delete station' } });
  }
};

// User CRUD
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').populate('stationId', 'name').skip(skip).limit(limit),
      User.countDocuments()
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error({ err: error }, 'Get users failed');
    res.status(500).json({ success: false, error: { message: 'Failed to get users' } });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    const userResponse = await User.findById(user._id).select('-password');
    logger.info({ userId: user._id }, 'User created');
    res.status(201).json({ success: true, data: userResponse });
  } catch (error) {
    logger.error({ err: error }, 'Create user failed');
    res.status(500).json({ success: false, error: { message: 'Failed to create user' } });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error({ err: error, userId: req.params.id }, 'Update user failed');
    res.status(500).json({ success: false, error: { message: 'Failed to update user' } });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    logger.error({ err: error, userId: req.params.id }, 'Delete user failed');
    res.status(500).json({ success: false, error: { message: 'Failed to delete user' } });
  }
};

// Rule CRUD
export const getRules = async (req, res) => {
  try {
    const rules = await Rule.find().sort({ priority: -1 });
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error({ err: error }, 'Get rules failed');
    res.status(500).json({ success: false, error: { message: 'Failed to get rules' } });
  }
};

export const createRule = async (req, res) => {
  try {
    const rule = new Rule(req.body);
    await rule.save();
    logger.info({ ruleId: rule._id }, 'Rule created');
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    logger.error({ err: error }, 'Create rule failed');
    res.status(500).json({ success: false, error: { message: 'Failed to create rule' } });
  }
};

export const updateRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error({ err: error, ruleId: req.params.id }, 'Update rule failed');
    res.status(500).json({ success: false, error: { message: 'Failed to update rule' } });
  }
};

export const deleteRule = async (req, res) => {
  try {
    const rule = await Rule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, error: { message: 'Rule not found' } });
    }
    res.json({ success: true, data: rule });
  } catch (error) {
    logger.error({ err: error, ruleId: req.params.id }, 'Delete rule failed');
    res.status(500).json({ success: false, error: { message: 'Failed to delete rule' } });
  }
};
