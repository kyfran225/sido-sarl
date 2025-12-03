import express from 'express';
import {
  getStations, createStation, updateStation, deleteStation,
  getUsers, createUser, updateUser, deleteUser,
  getRules, createRule, updateRule, deleteRule
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validation.middleware.js';
import {
  createStationSchema, updateStationSchema,
  createUserSchema, updateUserSchema,
  createRuleSchema, updateRuleSchema
} from '../schemas/admin.schemas.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin']));

// Station routes
router.get('/stations', getStations);
router.post('/stations', validateRequest(createStationSchema), createStation);
router.put('/stations/:id', validateRequest(updateStationSchema), updateStation);
router.delete('/stations/:id', deleteStation);

// User routes
router.get('/users', getUsers);
router.post('/users', validateRequest(createUserSchema), createUser);
router.put('/users/:id', validateRequest(updateUserSchema), updateUser);
router.delete('/users/:id', deleteUser);

// Rule routes
router.get('/rules', getRules);
router.post('/rules', validateRequest(createRuleSchema), createRule);
router.put('/rules/:id', validateRequest(updateRuleSchema), updateRule);
router.delete('/rules/:id', deleteRule);

export default router;
