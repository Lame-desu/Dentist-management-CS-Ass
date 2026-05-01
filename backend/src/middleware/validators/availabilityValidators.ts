import { body, query as queryValidator, param } from 'express-validator';

/**
 * Validation for PUT /api/availability (set full weekly schedule).
 * Body must be an array of { dayOfWeek, startTime, endTime, isAvailable }.
 */
export const setAvailabilityValidation = [
  body()
    .isArray({ min: 1 })
    .withMessage('Request body must be a non-empty array of availability entries.'),
  body('*.dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday).'),
  body('*.startTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('startTime must be in HH:MM format.'),
  body('*.endTime')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('endTime must be in HH:MM format.'),
  body('*.isAvailable')
    .isBoolean()
    .withMessage('isAvailable must be a boolean.'),
];

/**
 * Validation for PATCH /api/availability/:dayOfWeek (update single day).
 */
export const updateDayAvailabilityValidation = [
  param('dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('dayOfWeek must be an integer between 0 and 6.'),
  body('startTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('startTime must be in HH:MM format.'),
  body('endTime')
    .optional()
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('endTime must be in HH:MM format.'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean.'),
];

/**
 * Validation for GET /api/availability/search/available?date=&time=
 */
export const searchAvailableDentistsValidation = [
  queryValidator('date')
    .notEmpty()
    .withMessage('date query parameter is required.')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date must be in YYYY-MM-DD format.'),
  queryValidator('time')
    .notEmpty()
    .withMessage('time query parameter is required.')
    .matches(/^\d{2}:\d{2}$/)
    .withMessage('time must be in HH:MM format.'),
];

/**
 * Validation for GET /api/availability/:dentistId/schedule?date=
 */
export const dateQueryValidation = [
  param('dentistId')
    .isInt({ min: 1 })
    .withMessage('dentistId must be a positive integer.'),
  queryValidator('date')
    .notEmpty()
    .withMessage('date query parameter is required.')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date must be in YYYY-MM-DD format.'),
];

/**
 * Validation for GET /api/availability/:dentistId/week?weekStart=
 */
export const weekQueryValidation = [
  param('dentistId')
    .isInt({ min: 1 })
    .withMessage('dentistId must be a positive integer.'),
  queryValidator('weekStart')
    .notEmpty()
    .withMessage('weekStart query parameter is required.')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('weekStart must be in YYYY-MM-DD format.'),
];
