import express from 'express';
import { getPoints, getPointsHistory } from '../controllers/points.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// GET /api/points/:sid (get points snapshot)
router.get('/:sid', authenticate, getPoints);

// GET /api/points/:sid/history (get points history)
router.get('/:sid/history', authenticate, getPointsHistory);

export default router;
