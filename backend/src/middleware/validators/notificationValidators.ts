import { param, query as queryValidator } from 'express-validator';

/**
 * Validation rules for notification ID param.
 */
export const notificationIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer.'),
];

/**
 * Validation rules for listing notifications.
 */
export const listNotificationsValidation = [
  queryValidator('isRead')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('isRead must be true or false.'),

  queryValidator('type')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Type must be between 1 and 50 characters.'),

  queryValidator('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer.'),

  queryValidator('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100.'),
];
