import { Request, Response, NextFunction } from 'express';
import * as availabilityService from '../services/availabilityService.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';
import { query } from '../config/database.js';

// ═══════════════════════════════════════════════════════════════
// DENTIST — OWN AVAILABILITY
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/availability
 * Dentist sets their own weekly availability schedule.
 */
export async function setOwnAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dentistId = await resolveDentistId(req.user!.userId);
    const result = await availabilityService.setAvailability(dentistId, req.body);

    successResponse(res, result, 'Availability schedule updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/availability/:dayOfWeek
 * Dentist updates a single day of their availability.
 */
export async function updateOwnDayAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dentistId = await resolveDentistId(req.user!.userId);
    const dayOfWeek = parseInt(req.params.dayOfWeek, 10);

    if (isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
      throw new AppError('Invalid dayOfWeek. Must be 0-6.', 400);
    }

    const result = await availabilityService.updateDayAvailability(dentistId, dayOfWeek, req.body);

    successResponse(res, result, 'Day availability updated successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN — MANAGE ANY DENTIST'S AVAILABILITY
// ═══════════════════════════════════════════════════════════════

/**
 * PUT /api/availability/admin/:dentistId
 * Admin sets availability for a specific dentist.
 */
export async function setDentistAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dentistId = parseInt(req.params.dentistId, 10);

    if (isNaN(dentistId)) {
      throw new AppError('Invalid dentist ID.', 400);
    }

    const result = await availabilityService.setAvailability(dentistId, req.body);

    successResponse(res, result, 'Dentist availability updated successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// READ — ANY AUTHENTICATED USER
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/availability/:dentistId
 * Get a dentist's full weekly availability.
 */
export async function getDentistAvailability(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dentistId = parseInt(req.params.dentistId, 10);

    if (isNaN(dentistId)) {
      throw new AppError('Invalid dentist ID.', 400);
    }

    const result = await availabilityService.getAvailability(dentistId);

    successResponse(res, result, 'Dentist availability retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/availability/:dentistId/schedule?date=YYYY-MM-DD
 * Get detailed day schedule for a dentist.
 */
export async function getDentistDaySchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dentistId = parseInt(req.params.dentistId, 10);
    const { date } = req.query;

    if (isNaN(dentistId)) {
      throw new AppError('Invalid dentist ID.', 400);
    }

    if (!date) {
      throw new AppError('Date query parameter is required (format: YYYY-MM-DD).', 400);
    }

    const result = await availabilityService.getDentistDaySchedule(dentistId, date as string);

    successResponse(res, result, 'Dentist day schedule retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/availability/:dentistId/week?weekStart=YYYY-MM-DD
 * Get 7-day week schedule overview for a dentist.
 */
export async function getDentistWeekSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dentistId = parseInt(req.params.dentistId, 10);
    const { weekStart } = req.query;

    if (isNaN(dentistId)) {
      throw new AppError('Invalid dentist ID.', 400);
    }

    if (!weekStart) {
      throw new AppError('weekStart query parameter is required (format: YYYY-MM-DD).', 400);
    }

    const result = await availabilityService.getDentistWeekSchedule(dentistId, weekStart as string);

    successResponse(res, result, 'Dentist week schedule retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/availability/search/available?date=YYYY-MM-DD&time=HH:MM
 * Find dentists available at a specific date/time.
 */
export async function getAvailableDentistsForSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date, time } = req.query;

    if (!date || !time) {
      throw new AppError('Both date and time query parameters are required.', 400);
    }

    const result = await availabilityService.getAvailableDentistsForSlot(
      date as string,
      time as string
    );

    successResponse(res, result, 'Available dentists retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ─── Helper ──────────────────────────────────────────────────

/**
 * Resolve the dentist record ID from the authenticated user's userId.
 */
async function resolveDentistId(userId: string): Promise<number> {
  const result = await query('SELECT id FROM dentists WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    throw new AppError('Dentist profile not found.', 404);
  }
  return result.rows[0].id;
}
