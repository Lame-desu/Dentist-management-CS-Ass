import { Router } from 'express';
import * as queueController from '../controllers/queueController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '../utils/constants.js';
import {
  addToQueueValidation,
  queueEntryIdValidation,
  getTodayQueueValidation,
  queueStatsValidation,
} from '../middleware/validators/queueValidators.js';

const router = Router();

// ─── All routes require authentication ───────────────────────
router.use(authenticate);

// POST /api/queue — Add to queue (receptionist only)
router.post(
  '/',
  authorize(UserRole.RECEPTIONIST),
  validate(addToQueueValidation),
  queueController.addToQueue
);

// GET /api/queue/today — Today's queue (receptionist + dentist)
router.get(
  '/today',
  authorize(UserRole.RECEPTIONIST, UserRole.DENTIST),
  validate(getTodayQueueValidation),
  queueController.getTodayQueue
);

// GET /api/queue/stats — Queue stats (receptionist + admin)
router.get(
  '/stats',
  authorize(UserRole.RECEPTIONIST, UserRole.ADMIN),
  validate(queueStatsValidation),
  queueController.getQueueStats
);

// PATCH /api/queue/:id/call — Call patient (receptionist only)
router.patch(
  '/:id/call',
  authorize(UserRole.RECEPTIONIST),
  validate(queueEntryIdValidation),
  queueController.callPatient
);

// PATCH /api/queue/:id/complete — Complete queue entry (receptionist or dentist)
router.patch(
  '/:id/complete',
  authorize(UserRole.RECEPTIONIST, UserRole.DENTIST),
  validate(queueEntryIdValidation),
  queueController.completeQueueEntry
);

// PATCH /api/queue/:id/cancel — Cancel queue entry (receptionist only)
router.patch(
  '/:id/cancel',
  authorize(UserRole.RECEPTIONIST),
  validate(queueEntryIdValidation),
  queueController.cancelQueueEntry
);

export default router;
