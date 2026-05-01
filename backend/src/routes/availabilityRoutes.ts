import { Router } from 'express';
import * as availabilityController from '../controllers/availabilityController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '../utils/constants.js';
import {
  setAvailabilityValidation,
  updateDayAvailabilityValidation,
  searchAvailableDentistsValidation,
  dateQueryValidation,
  weekQueryValidation,
} from '../middleware/validators/availabilityValidators.js';

const router = Router();

// ─── All routes require authentication ───────────────────────
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════
// SEARCH — Must be before parameterized routes
// ═══════════════════════════════════════════════════════════════

// GET /api/availability/search/available — Find dentists available at date/time
router.get(
  '/search/available',
  validate(searchAvailableDentistsValidation),
  availabilityController.getAvailableDentistsForSlot
);

// ═══════════════════════════════════════════════════════════════
// ADMIN — Manage any dentist's availability
// ═══════════════════════════════════════════════════════════════

// PUT /api/availability/admin/:dentistId — Admin sets availability for a dentist
router.put(
  '/admin/:dentistId',
  authorize(UserRole.ADMIN),
  validate(setAvailabilityValidation),
  availabilityController.setDentistAvailability
);

// ═══════════════════════════════════════════════════════════════
// DENTIST — Own availability management
// ═══════════════════════════════════════════════════════════════

// PUT /api/availability — Dentist sets own availability
router.put(
  '/',
  authorize(UserRole.DENTIST),
  validate(setAvailabilityValidation),
  availabilityController.setOwnAvailability
);

// PATCH /api/availability/:dayOfWeek — Dentist updates single day
router.patch(
  '/:dayOfWeek',
  authorize(UserRole.DENTIST),
  validate(updateDayAvailabilityValidation),
  availabilityController.updateOwnDayAvailability
);

// ═══════════════════════════════════════════════════════════════
// READ — Any authenticated user (must be after specific routes)
// ═══════════════════════════════════════════════════════════════

// GET /api/availability/:dentistId/schedule — Day schedule
router.get(
  '/:dentistId/schedule',
  validate(dateQueryValidation),
  availabilityController.getDentistDaySchedule
);

// GET /api/availability/:dentistId/week — Week schedule
router.get(
  '/:dentistId/week',
  validate(weekQueryValidation),
  availabilityController.getDentistWeekSchedule
);

// GET /api/availability/:dentistId — Weekly availability
router.get(
  '/:dentistId',
  availabilityController.getDentistAvailability
);

export default router;
