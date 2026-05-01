import { body, param, query as queryValidator } from 'express-validator';

/**
 * Validation rules for adding to queue.
 */
export const addToQueueValidation = [
  body('appointmentId')
    .notEmpty()
    .withMessage('Appointment ID is required.')
    .isInt({ min: 1 })
    .withMessage('Appointment ID must be a positive integer.'),
];

/**
 * Validation rules for queue entry ID param.
 */
export const queueEntryIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Queue entry ID must be a positive integer.'),
];

/**
 * Validation rules for getting today's queue.
 */
export const getTodayQueueValidation = [
  queryValidator('dentistId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Dentist ID must be a positive integer.'),
];

/**
 * Validation rules for queue stats query.
 */
export const queueStatsValidation = [
  queryValidator('date')
    .optional()
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD).'),
];
