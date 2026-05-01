import { Router } from 'express';
import * as appointmentController from '../controllers/appointmentController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '../utils/constants.js';
import {
  createAppointmentValidation,
  reviewAppointmentValidation,
  walkInAppointmentValidation,
  respondAppointmentValidation,
  cancelAppointmentValidation,
  completeAppointmentValidation,
  getAppointmentByIdValidation,
  availableSlotsValidation,
  dentistScheduleValidation,
} from '../middleware/validators/appointmentValidators.js';

const router = Router();

// ─── All routes require authentication ───────────────────────
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════
// SHARED / PUBLIC (any authenticated user) — MUST be before /:id
// ═══════════════════════════════════════════════════════════════

// GET /api/appointments/slots — Get available time slots
router.get(
  '/slots',
  validate(availableSlotsValidation),
  appointmentController.getAvailableSlots
);

// ═══════════════════════════════════════════════════════════════
// PATIENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// POST /api/appointments — Patient books appointment
router.post(
  '/',
  authorize(UserRole.PATIENT),
  validate(createAppointmentValidation),
  appointmentController.createAppointment
);

// GET /api/appointments/my — Patient views own appointments
router.get(
  '/my',
  authorize(UserRole.PATIENT),
  appointmentController.getMyAppointments
);

// PATCH /api/appointments/:id/cancel — Patient or receptionist cancels
router.patch(
  '/:id/cancel',
  authorize(UserRole.PATIENT, UserRole.RECEPTIONIST),
  validate(cancelAppointmentValidation),
  appointmentController.cancelAppointment
);

// ═══════════════════════════════════════════════════════════════
// RECEPTIONIST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/appointments/pending — Receptionist views pending appointments
router.get(
  '/pending',
  authorize(UserRole.RECEPTIONIST),
  appointmentController.getPendingAppointments
);

// POST /api/appointments/:id/review — Receptionist reviews appointment
router.post(
  '/:id/review',
  authorize(UserRole.RECEPTIONIST),
  validate(reviewAppointmentValidation),
  appointmentController.reviewAppointment
);

// GET /api/appointments/forwarded — Receptionist views forwarded appointments
router.get(
  '/forwarded',
  authorize(UserRole.RECEPTIONIST),
  appointmentController.getForwardedAppointments
);

// POST /api/appointments/walk-in — Receptionist creates walk-in appointment
router.post(
  '/walk-in',
  authorize(UserRole.RECEPTIONIST),
  validate(walkInAppointmentValidation),
  appointmentController.createWalkInAppointment
);

// GET /api/appointments — Receptionist views all appointments (full view)
router.get(
  '/',
  authorize(UserRole.RECEPTIONIST, UserRole.ADMIN),
  appointmentController.getAllAppointments
);

// ═══════════════════════════════════════════════════════════════
// DENTIST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

// GET /api/appointments/dentist/schedule — Dentist views day schedule
router.get(
  '/dentist/schedule',
  authorize(UserRole.DENTIST),
  validate(dentistScheduleValidation),
  appointmentController.getDentistSchedule
);

// GET /api/appointments/dentist — Dentist views own appointments
router.get(
  '/dentist',
  authorize(UserRole.DENTIST),
  appointmentController.getDentistAppointments
);

// POST /api/appointments/:id/respond — Dentist responds to appointment
router.post(
  '/:id/respond',
  authorize(UserRole.DENTIST),
  validate(respondAppointmentValidation),
  appointmentController.respondToAppointment
);

// PATCH /api/appointments/:id/complete — Dentist marks as completed
router.patch(
  '/:id/complete',
  authorize(UserRole.DENTIST),
  validate(completeAppointmentValidation),
  appointmentController.completeAppointment
);

// ═══════════════════════════════════════════════════════════════
// SHARED — Must be LAST (catches /:id)
// ═══════════════════════════════════════════════════════════════

// GET /api/appointments/:id — Get appointment details (any authenticated user, role-filtered)
router.get(
  '/:id',
  validate(getAppointmentByIdValidation),
  appointmentController.getAppointmentById
);

export default router;
