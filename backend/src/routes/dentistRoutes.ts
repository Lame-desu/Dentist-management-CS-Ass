import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// ─── Public Dentist Routes (any authenticated user) ──────────

// GET /api/dentists — List all dentists with availability
router.get('/', authenticate, userController.getDentistsPublic);

// GET /api/dentists/:id/availability — Get specific dentist's availability
router.get('/:id/availability', authenticate, userController.getDentistAvailability);

export default router;
