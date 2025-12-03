import express from 'express';
import authRoutes from './auth.routes.js';
import clientsRoutes from './clients.routes.js';
import transactionsRoutes from './transactions.routes.js';
import syncRoutes from './sync.routes.js';
import pointsRoutes from './points.routes.js';
import bonsRoutes from './bons.routes.js';
import adminRoutes from './admin.routes.js';
import reportsRoutes from './reports.routes.js';

const router = express.Router();

// Mount sub-routes
router.use('/auth', authRoutes);
router.use('/clients', clientsRoutes);
router.use('/transactions', transactionsRoutes);
router.use('/sync', syncRoutes);
router.use('/points', pointsRoutes);
router.use('/bons', bonsRoutes);
router.use('/admin', adminRoutes);
router.use('/reports', reportsRoutes);

export default router;
