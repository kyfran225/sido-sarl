import express from 'express';
import { listBons, useBonHandler } from '../controllers/bons.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { useBonSchema } from '../schemas/bons.schemas.js';

const router = express.Router();

// GET /api/bons - List bons for authenticated user
router.get('/', authenticate, authorize(['pompiste', 'manager', 'admin']), listBons);

// POST /api/bons/:code/use - Use a bon
router.post('/:code/use', authenticate, authorize(['pompiste', 'manager', 'admin']), validateRequest(useBonSchema), useBonHandler);

export default router;
