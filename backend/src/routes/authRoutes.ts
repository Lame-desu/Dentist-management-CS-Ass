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

// GET /api/auth/verify-email — Verify email address with token
router.get('/verify-email', authController.verifyEmail);

// POST /api/auth/set-password — Set password for invited user
router.post('/set-password', authController.setPassword);

// POST /api/auth/resend-verification — Resend verification or invitation email
router.post('/resend-verification', authController.resendVerification);

// ─── Protected Routes ────────────────────────────────────────

// GET /api/auth/profile — Get current user's profile
router.get('/profile', authenticate, authController.getProfile);

// PUT /api/auth/profile — Update current user's profile
router.put('/profile', authenticate, validate(profileUpdateValidation), authController.updateProfile);

// PUT /api/auth/password — Change current user's password
router.put('/password', authenticate, authController.changePassword);

export default router;
