import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';

/**
 * Request validation middleware wrapper.
 * Runs an array of express-validator validation chains, then checks for errors.
 * If validation fails, returns a 400 response with the error details.
 *
 * @example
 * router.post('/users', validate([
 *   body('email').isEmail(),
 *   body('password').isLength({ min: 8 }),
 * ]), createUser);
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);

    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((err) => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg,
      })),
    });
  };
}
