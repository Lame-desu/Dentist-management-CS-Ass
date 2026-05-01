import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '../utils/constants.js';
import {
  appointmentReportValidation,
  patientReportValidation,
} from '../middleware/validators/adminValidators.js';

const router = Router();

// ─── All routes require authentication + admin role ──────────
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// GET /api/admin/dashboard — Dashboard stats
router.get(
  '/dashboard',
  adminController.getDashboardStats
);

// GET /api/admin/reports/appointments — Appointment report
router.get(
  '/reports/appointments',
  validate(appointmentReportValidation),
  adminController.getAppointmentReport
);

// GET /api/admin/reports/patients — Patient report
router.get(
  '/reports/patients',
  validate(patientReportValidation),
  adminController.getPatientReport
);

export default router;
