import { Router } from 'express';
import * as dentalRecordController from '../controllers/dentalRecordController.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { validate } from '../middleware/validate.js';
import { UserRole } from '../utils/constants.js';
import {
  createDentalRecordValidation,
  updateDentalRecordValidation,
  getDentalRecordByIdValidation,
  getRecordsByPatientValidation,
} from '../middleware/validators/dentalRecordValidators.js';

const router = Router();

// ─── All routes require authentication ───────────────────────
router.use(authenticate);

// ═══════════════════════════════════════════════════════════════
// Named sub-routes — MUST be before /:id to avoid param capture
// ═══════════════════════════════════════════════════════════════

// GET /api/dental-records/my — Patient views own records
router.get(
  '/my',
  authorize(UserRole.PATIENT),
  dentalRecordController.getMyRecords
);

// GET /api/dental-records/dentist/my — Dentist views records they created
router.get(
  '/dentist/my',
  authorize(UserRole.DENTIST),
  dentalRecordController.getMyDentistRecords
);

// GET /api/dental-records/patient/:patientId — Get records by patient (role-based)
router.get(
  '/patient/:patientId',
  authorize(UserRole.DENTIST, UserRole.RECEPTIONIST, UserRole.ADMIN),
  validate(getRecordsByPatientValidation),
  dentalRecordController.getRecordsByPatient
);

// ═══════════════════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════════════════

// POST /api/dental-records — Dentist creates record
router.post(
  '/',
  authorize(UserRole.DENTIST),
  validate(createDentalRecordValidation),
  dentalRecordController.createRecord
);

// PUT /api/dental-records/:id — Dentist updates record
router.put(
  '/:id',
  authorize(UserRole.DENTIST),
  validate(updateDentalRecordValidation),
  dentalRecordController.updateRecord
);

// GET /api/dental-records/:id — Get single record with prescriptions (role-based)
router.get(
  '/:id',
  authorize(UserRole.PATIENT, UserRole.DENTIST, UserRole.RECEPTIONIST, UserRole.ADMIN),
  validate(getDentalRecordByIdValidation),
  dentalRecordController.getRecordById
);

export default router;
