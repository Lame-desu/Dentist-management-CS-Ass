import { body, param } from 'express-validator';

/**
 * Validation rules for creating a dental record.
 */
export const createDentalRecordValidation = [
  body('appointmentId')
    .notEmpty()
    .withMessage('Appointment ID is required.')
    .isInt({ min: 1 })
    .withMessage('Appointment ID must be a positive integer.'),

  body('diagnosis')
    .notEmpty()
    .withMessage('Diagnosis is required.')
    .trim()
    .isLength({ min: 2, max: 5000 })
    .withMessage('Diagnosis must be between 2 and 5000 characters.'),

  body('treatment')
    .notEmpty()
    .withMessage('Treatment is required.')
    .trim()
    .isLength({ min: 2, max: 5000 })
    .withMessage('Treatment must be between 2 and 5000 characters.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters.'),

  // Optional inline prescriptions
  body('prescriptions')
    .optional()
    .isArray()
    .withMessage('Prescriptions must be an array.'),

  body('prescriptions.*.medicineName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Medicine name is required for each prescription.')
    .isLength({ max: 200 })
    .withMessage('Medicine name must not exceed 200 characters.'),

  body('prescriptions.*.dosage')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Dosage is required for each prescription.')
    .isLength({ max: 100 })
    .withMessage('Dosage must not exceed 100 characters.'),

  body('prescriptions.*.duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must not exceed 100 characters.'),

  body('prescriptions.*.remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must not exceed 1000 characters.'),
];

/**
 * Validation rules for updating a dental record.
 */
export const updateDentalRecordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Dental record ID must be a positive integer.'),

  body('diagnosis')
    .optional()
    .trim()
    .isLength({ min: 2, max: 5000 })
    .withMessage('Diagnosis must be between 2 and 5000 characters.'),

  body('treatment')
    .optional()
    .trim()
    .isLength({ min: 2, max: 5000 })
    .withMessage('Treatment must be between 2 and 5000 characters.'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes must not exceed 5000 characters.'),
];

/**
 * Validation rules for getting a dental record by ID.
 */
export const getDentalRecordByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Dental record ID must be a positive integer.'),
];

/**
 * Validation rules for getting dental records by patient ID.
 */
export const getRecordsByPatientValidation = [
  param('patientId')
    .isInt({ min: 1 })
    .withMessage('Patient ID must be a positive integer.'),
];
