import { body } from 'express-validator';

/**
 * Validation rules for patient registration.
 */
export const registerValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_subaddress: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required.')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/)
    .withMessage('Please provide a valid phone number.'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD).'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other.'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters.'),

  body('emergencyContact')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact must not exceed 100 characters.'),

  body('bloodGroup')
    .optional()
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group.'),

  body('allergies')
    .optional()
    .trim(),
];

/**
 * Validation rules for login.
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_subaddress: false }),

  body('password')
    .notEmpty()
    .withMessage('Password is required.'),
];

/**
 * Validation rules for profile update.
 */
export const profileUpdateValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),

  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^\+?[\d\s\-()]{7,20}$/)
    .withMessage('Please provide a valid phone number.'),

  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD).'),

  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other.'),

  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters.'),

  body('emergencyContact')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Emergency contact must not exceed 100 characters.'),

  body('bloodGroup')
    .optional()
    .trim()
    .isIn(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])
    .withMessage('Invalid blood group.'),

  body('allergies')
    .optional()
    .trim(),

  body('specialization')
    .optional()
    .trim(),

  body('bio')
    .optional()
    .trim(),

  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a non-negative integer.'),

  body('shift')
    .optional()
    .isIn(['morning', 'afternoon', 'full_day'])
    .withMessage('Shift must be morning, afternoon, or full_day.'),
];

/**
 * Validation rules for creating staff (dentist/receptionist) by admin.
 */
export const createStaffValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required.')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required.')
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_subaddress: false }),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  body('phoneNumber')
    .optional()
    .trim(),

  body('role')
    .notEmpty()
    .withMessage('Role is required.')
    .isIn(['dentist', 'receptionist'])
    .withMessage('Role must be dentist or receptionist.'),

  // Dentist-specific fields
  body('specialization')
    .optional()
    .trim(),

  body('licenseNumber')
    .optional()
    .trim(),

  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a non-negative integer.'),

  body('bio')
    .optional()
    .trim(),

  body('availability')
    .optional()
    .isArray()
    .withMessage('Availability must be an array.'),

  body('availability.*.dayOfWeek')
    .isInt({ min: 0, max: 6 })
    .withMessage('Day of week must be between 0 (Sunday) and 6 (Saturday).'),

  body('availability.*.startTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('Start time must be in HH:MM format.'),

  body('availability.*.endTime')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage('End time must be in HH:MM format.'),

  // Receptionist-specific fields
  body('shift')
    .optional()
    .isIn(['morning', 'afternoon', 'full_day'])
    .withMessage('Shift must be morning, afternoon, or full_day.'),
];

/**
 * Validation rules for admin updating a user.
 */
export const adminUpdateUserValidation = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address.')
    .normalizeEmail({ gmail_remove_subaddress: false }),

  body('phoneNumber')
    .optional()
    .trim(),

  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long.'),

  body('specialization')
    .optional()
    .trim(),

  body('licenseNumber')
    .optional()
    .trim(),

  body('yearsOfExperience')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Years of experience must be a non-negative integer.'),

  body('bio')
    .optional()
    .trim(),

  body('shift')
    .optional()
    .isIn(['morning', 'afternoon', 'full_day'])
    .withMessage('Shift must be morning, afternoon, or full_day.'),
];
