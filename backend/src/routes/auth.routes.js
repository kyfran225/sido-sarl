import express from 'express';
import { login, refreshToken, logout, revokeDevice } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import { loginSchema, refreshTokenSchema, revokeDeviceSchema } from '../schemas/auth.schemas.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', validateRequest(loginSchema), login);

// POST /api/auth/refresh
router.post('/refresh', validateRequest(refreshTokenSchema), refreshToken);

// POST /api/auth/logout (requires auth)
router.post('/logout', authenticate, logout);

// POST /api/auth/revoke-device (requires auth, admin/manager)
router.post('/revoke-device', authenticate, validateRequest(revokeDeviceSchema), revokeDevice);

export default router;
