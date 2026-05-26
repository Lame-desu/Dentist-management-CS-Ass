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

/**
 * GET /api/auth/verify-email
 * Verify email address using token from query string.
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.query.token as string;
    if (!token) {
      throw new AppError('Verification token is required.', 400);
    }
    const result = await authService.verifyEmail(token);
    successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/set-password
 * Set password for an invited user using their email token.
 */
export async function setPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      throw new AppError('Token and password are required.', 400);
    }
    const result = await authService.setPassword(token, password);
    successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/auth/password
 * Change the authenticated user's password.
 */
export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401);
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required.', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters.', 400);
    }

    const result = await authService.changePassword(req.user.userId, currentPassword, newPassword);
    successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/auth/resend-verification
 * Resend verification or invitation email.
 */
export async function resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required.', 400);
    }
    const result = await authService.resendVerification(email);
    successResponse(res, result, result.message);
  } catch (error) {
    next(error);
  }
}
