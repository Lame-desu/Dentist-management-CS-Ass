import { body, param, query as queryValidator } from 'express-validator';

/**
 * Validation rules for creating an appointment (patient).
 */
export const createAppointmentValidation = [
  body('dentistId')
    .notEmpty()
    .withMessage('Dentist ID is required.')
    .isInt({ min: 1 })
    .withMessage('Dentist ID must be a positive integer.'),

  body('appointmentDate')
    .notEmpty()
    .withMessage('Appointment date is required.')
    .isISO8601()
    .withMessage('Appointment date must be a valid date (YYYY-MM-DD).'),

  body('appointmentTime')
    .notEmpty()
    .withMessage('Appointment time is required.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Appointment time must be in HH:MM format (24-hour).'),

  body('isEmergency')
    .optional()
    .isBoolean()
    .withMessage('isEmergency must be a boolean.'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters.'),
];

/**
 * Validation rules for reviewing an appointment (receptionist).
 */
export const reviewAppointmentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Appointment ID must be a positive integer.'),

  body('action')
    .notEmpty()
    .withMessage('Action is required.')
    .isIn(['forward', 'reject', 'reassign'])
    .withMessage('Action must be forward, reject, or reassign.'),

  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Rejection reason must not exceed 1000 characters.'),

  body('newDentistId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('New dentist ID must be a positive integer.'),
];

/**
 * Validation rules for creating a walk-in appointment (receptionist).
 */
export const walkInAppointmentValidation = [
  body('patientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Patient ID must be a positive integer.'),

  body('patientData')
    .optional()
    .isObject()
    .withMessage('Patient data must be an object.'),

  body('patientData.fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Patient full name must be between 2 and 100 characters.'),

  body('patientData.email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('patientData.phoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/)
    .withMessage('Please provide a valid phone number.'),

  body('patientData.dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD).'),

  body('patientData.gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other.'),

  body('dentistId')
    .notEmpty()
    .withMessage('Dentist ID is required.')
    .isInt({ min: 1 })
    .withMessage('Dentist ID must be a positive integer.'),

  body('appointmentDate')
    .notEmpty()
    .withMessage('Appointment date is required.')
    .isISO8601()
    .withMessage('Appointment date must be a valid date (YYYY-MM-DD).'),

  body('appointmentTime')
    .notEmpty()
    .withMessage('Appointment time is required.')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Appointment time must be in HH:MM format (24-hour).'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Reason must not exceed 1000 characters.'),

  body('isEmergency')
    .optional()
    .isBoolean()
    .withMessage('isEmergency must be a boolean.'),
];

/**
 * Validation rules for dentist responding to an appointment.
 */
export const respondAppointmentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Appointment ID must be a positive integer.'),

  body('action')
    .notEmpty()
    .withMessage('Action is required.')
    .isIn(['approve', 'reject', 'reschedule'])
    .withMessage('Action must be approve, reject, or reschedule.'),

  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Rejection reason must not exceed 1000 characters.'),

  body('suggestedDate')
    .optional()
    .isISO8601()
    .withMessage('Suggested date must be a valid date (YYYY-MM-DD).'),

  body('suggestedTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Suggested time must be in HH:MM format (24-hour).'),
];

/**
 * Validation rules for cancelling an appointment.
 */
export const cancelAppointmentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Appointment ID must be a positive integer.'),
];

/**
 * Validation rules for completing an appointment.
 */
export const completeAppointmentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Appointment ID must be a positive integer.'),
];

/**
 * Validation rules for getting appointment by ID.
 */
export const getAppointmentByIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Appointment ID must be a positive integer.'),
];

/**
 * Validation rules for available slots query.
 */
export const availableSlotsValidation = [
  queryValidator('dentistId')
    .notEmpty()
    .withMessage('Dentist ID is required.')
    .isInt({ min: 1 })
    .withMessage('Dentist ID must be a positive integer.'),

  queryValidator('date')
    .notEmpty()
    .withMessage('Date is required.')
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD).'),
];

/**
 * Validation rules for dentist schedule query.
 */
export const dentistScheduleValidation = [
  queryValidator('date')
    .notEmpty()
    .withMessage('Date is required.')
    .isISO8601()
    .withMessage('Date must be a valid date (YYYY-MM-DD).'),
];
