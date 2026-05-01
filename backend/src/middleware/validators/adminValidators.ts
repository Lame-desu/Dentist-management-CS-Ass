import { query as queryValidator } from 'express-validator';

/**
 * Validation rules for appointment report query.
 */
export const appointmentReportValidation = [
  queryValidator('from')
    .notEmpty()
    .withMessage('From date is required.')
    .isISO8601()
    .withMessage('From date must be a valid date (YYYY-MM-DD).'),

  queryValidator('to')
    .notEmpty()
    .withMessage('To date is required.')
    .isISO8601()
    .withMessage('To date must be a valid date (YYYY-MM-DD).'),
];

/**
 * Validation rules for patient report query.
 */
export const patientReportValidation = [
  queryValidator('from')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid date (YYYY-MM-DD).'),

  queryValidator('to')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid date (YYYY-MM-DD).'),
];
