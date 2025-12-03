import express from 'express';
import { createTransactionHandler, createBatchTransactionsHandler } from '../controllers/transactions.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { createTransactionSchema, createBatchTransactionsSchema } from '../schemas/transactions.schemas.js';

const router = express.Router();

// POST /api/transactions (single transaction ingestion)
router.post('/', authenticate, validateRequest(createTransactionSchema), createTransactionHandler);

// POST /api/transactions/batch (batch transaction ingestion)
router.post('/batch', authenticate, validateRequest(createBatchTransactionsSchema), createBatchTransactionsHandler);

export default router;
