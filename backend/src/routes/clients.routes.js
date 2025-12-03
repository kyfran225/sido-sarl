import express from 'express';
import { createClient, getClientBySid, searchClients } from '../controllers/clients.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createClientSchema } from '../schemas/clients.schemas.js';

const router = express.Router();

// POST /api/clients (create client)
router.post('/', authenticate, validateRequest(createClientSchema), createClient);

// GET /api/clients/:sid (get client by SID)
router.get('/:sid', authenticate, getClientBySid);

// GET /api/clients (search clients)
router.get('/', authenticate, searchClients);

export default router;
