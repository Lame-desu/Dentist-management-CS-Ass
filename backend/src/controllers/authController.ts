import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * POST /api/auth/register
 * Public patient registration.
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
    } = req.body;

    const result = await authService.register({
      fullName,
      email,
      password,
      phoneNumber,
      dateOfBirth,
      gender,
      address,
      emergencyContact,
      bloodGroup,
      allergies,
    });

    successResponse(res, result, 'Registration successful.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    successResponse(res, result, 'Login successful.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/auth/profile
 * Get current authenticated user's profile.
 */
export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const profile = await authService.getProfile(req.user.userId);

    successResponse(res, profile, 'Profile retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/profile
 * Update current authenticated user's profile.
 */
export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const updatedProfile = await authService.updateProfile(req.user.userId, req.body);

    successResponse(res, updatedProfile, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
}
