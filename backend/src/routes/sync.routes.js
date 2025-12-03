import express from 'express';
import { syncBatchHandler } from '../controllers/sync.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { syncBatchSchema } from '../schemas/sync.schemas.js';

const router = express.Router();

// POST /api/sync - Batch sync transactions
router.post('/', authenticate, authorize(['pompiste', 'manager', 'admin']), validateRequest(syncBatchSchema), syncBatchHandler);

export default router;
