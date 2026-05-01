import { Router } from 'express';
import * as prescriptionController from '../controllers/prescriptionController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '../utils/constants.js';
import {
  createPrescriptionValidation,
  createBulkPrescriptionValidation,
  updatePrescriptionValidation,
  deletePrescriptionValidation,
  getPrescriptionsByRecordValidation,
} from '../middleware/validators/prescriptionValidators.js';

const router = Router();

// ─── All routes require authentication ───────────────────────
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════
// Named sub-routes — MUST be before /:id to avoid param capture
// ═══════════════════════════════════════════════════════════════

// POST /api/prescriptions/bulk — Dentist adds multiple prescriptions
router.post(
  '/bulk',
  authorize(UserRole.DENTIST),
  validate(createBulkPrescriptionValidation),
  prescriptionController.createBulkPrescriptions
);

// GET /api/prescriptions/my — Patient views own prescriptions
router.get(
  '/my',
  authorize(UserRole.PATIENT),
  prescriptionController.getMyPrescriptions
);

// GET /api/prescriptions/record/:recordId — Get prescriptions by record
router.get(
  '/record/:recordId',
  authorize(UserRole.PATIENT, UserRole.DENTIST, UserRole.RECEPTIONIST, UserRole.ADMIN),
  validate(getPrescriptionsByRecordValidation),
  prescriptionController.getPrescriptionsByRecord
);

// ═══════════════════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════════════════

// POST /api/prescriptions — Dentist adds single prescription
router.post(
  '/',
  authorize(UserRole.DENTIST),
  validate(createPrescriptionValidation),
  prescriptionController.createPrescription
);

// PUT /api/prescriptions/:id — Dentist updates prescription
router.put(
  '/:id',
  authorize(UserRole.DENTIST),
  validate(updatePrescriptionValidation),
  prescriptionController.updatePrescription
);

// DELETE /api/prescriptions/:id — Dentist deletes prescription
router.delete(
  '/:id',
  authorize(UserRole.DENTIST),
  validate(deletePrescriptionValidation),
  prescriptionController.deletePrescription
);

export default router;
