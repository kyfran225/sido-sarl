import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { getReports } from '../controllers/reports.controller.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /api/reports - Get reports data (admin only for now)
router.get('/', authorize(['admin']), getReports);

export default router;
