import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/userService.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/users
 * Admin only. List all users with optional role filter and pagination.
 */
export async function getAllUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { role, page, limit } = req.query;

    const result = await userService.getAllUsers({
      role: role as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    successResponse(res, result, 'Users retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/users/:id
 * Admin only. Get single user details.
 */
export async function getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.getUserById(req.params.id);

    successResponse(res, user, 'User retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/users/staff
 * Admin only. Create dentist or receptionist account.
 */
export async function createStaffUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.createStaffUser(req.body);

    successResponse(res, user, 'Staff account created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/users/:id
 * Admin only. Update user.
 */
export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    successResponse(res, user, 'User updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/users/:id/toggle-active
 * Admin only. Activate/deactivate user account.
 */
export async function toggleUserActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.toggleUserActive(req.params.id);

    const action = result.is_active ? 'activated' : 'deactivated';
    successResponse(res, result, `User ${action} successfully.`);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dentists
 * Public (any authenticated user). List dentists with availability.
 */
export async function getDentistsPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dentists = await userService.getDentistsPublic();

    successResponse(res, dentists, 'Dentists retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dentists/:id/availability
 * Public. Get specific dentist's availability schedule.
 */
export async function getDentistAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await userService.getDentistAvailability(req.params.id);

    successResponse(res, result, 'Dentist availability retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
