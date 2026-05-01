import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '../utils/constants.js';
import {
  createStaffValidation,
  adminUpdateUserValidation,
} from '../middleware/validators/authValidators.js';

const router = Router();

// ─── Admin-Only User Management ──────────────────────────────

// GET /api/users — List all users (with optional ?role= filter, ?page=&limit= pagination)
router.get('/', authenticate, authorize(UserRole.ADMIN), userController.getAllUsers);

// GET /api/users/:id — Get single user details
router.get('/:id', authenticate, authorize(UserRole.ADMIN), userController.getUserById);

// POST /api/users/staff — Create dentist or receptionist account
router.post(
  '/staff',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createStaffValidation),
  userController.createStaffUser
);

// PUT /api/users/:id — Update user
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(adminUpdateUserValidation),
  userController.updateUser
);

// PATCH /api/users/:id/toggle-active — Activate/deactivate user account
router.patch(
  '/:id/toggle-active',
  authenticate,
  authorize(UserRole.ADMIN),
  userController.toggleUserActive
);

export default router;
