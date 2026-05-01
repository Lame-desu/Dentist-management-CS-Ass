import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  registerValidation,
  loginValidation,
  profileUpdateValidation,
} from '../middleware/validators/authValidators.js';

const router = Router();

// ─── Public Routes ───────────────────────────────────────────

// POST /api/auth/register — Register a new patient account
router.post('/register', validate(registerValidation), authController.register);

// POST /api/auth/login — Login with email and password
router.post('/login', validate(loginValidation), authController.login);

// ─── Protected Routes ────────────────────────────────────────

// GET /api/auth/profile — Get current user's profile
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/auth/profile — Update current user's profile
router.put('/profile', authenticate, validate(profileUpdateValidation), authController.updateProfile);

export default router;
