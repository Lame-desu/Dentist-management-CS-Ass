import { body, param } from 'express-validator';

/**
 * Validation rules for creating a single prescription.
 */
export const createPrescriptionValidation = [
  body('dentalRecordId')
    .notEmpty()
    .withMessage('Dental record ID is required.')
    .isInt({ min: 1 })
    .withMessage('Dental record ID must be a positive integer.'),

  body('medicineName')
    .notEmpty()
    .withMessage('Medicine name is required.')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Medicine name must not exceed 200 characters.'),

  body('dosage')
    .notEmpty()
    .withMessage('Dosage is required.')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dosage must not exceed 100 characters.'),

  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must not exceed 100 characters.'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must not exceed 1000 characters.'),
];

/**
 * Validation rules for creating bulk prescriptions.
 */
export const createBulkPrescriptionValidation = [
  body('dentalRecordId')
    .notEmpty()
    .withMessage('Dental record ID is required.')
    .isInt({ min: 1 })
    .withMessage('Dental record ID must be a positive integer.'),

  body('prescriptions')
    .notEmpty()
    .withMessage('Prescriptions array is required.')
    .isArray({ min: 1 })
    .withMessage('At least one prescription is required.'),

  body('prescriptions.*.medicineName')
    .notEmpty()
    .withMessage('Medicine name is required for each prescription.')
    .trim()
    .isLength({ max: 200 })
    .withMessage('Medicine name must not exceed 200 characters.'),

  body('prescriptions.*.dosage')
    .notEmpty()
    .withMessage('Dosage is required for each prescription.')
    .trim()
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
 * Validation rules for updating a prescription.
 */
export const updatePrescriptionValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Prescription ID must be a positive integer.'),

  body('medicineName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Medicine name must not exceed 200 characters.'),

  body('dosage')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Dosage must not exceed 100 characters.'),

  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Duration must not exceed 100 characters.'),

  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Remarks must not exceed 1000 characters.'),
];

/**
 * Validation rules for deleting a prescription.
 */
export const deletePrescriptionValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Prescription ID must be a positive integer.'),
];

/**
 * Validation rules for getting prescriptions by record ID.
 */
export const getPrescriptionsByRecordValidation = [
  param('recordId')
    .isInt({ min: 1 })
    .withMessage('Record ID must be a positive integer.'),
];
