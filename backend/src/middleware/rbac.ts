import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../utils/constants.js';
import { AppError } from './errorHandler.js';

/**
 * Role-based access control middleware.
 * Restricts access to routes based on the authenticated user's role.
 *
 * @param allowedRoles - Array of roles permitted to access the route
 *
 * @example
 * router.get('/admin-only', authenticate, authorize(UserRole.ADMIN), handler);
 * router.get('/staff', authenticate, authorize(UserRole.ADMIN, UserRole.RECEPTIONIST), handler);
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required.', 401));
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return next(
        new AppError(
          `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
}
