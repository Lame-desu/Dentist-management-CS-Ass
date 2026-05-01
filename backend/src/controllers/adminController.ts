import { Request, Response, NextFunction } from 'express';
import * as adminService from '../services/adminService.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

// ═══════════════════════════════════════════════════════════════
// DASHBOARD STATS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/dashboard
 * Get aggregate dashboard statistics. (admin only)
 */
export async function getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const stats = await adminService.getDashboardStats();

    successResponse(res, stats, 'Dashboard statistics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// APPOINTMENT REPORT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/reports/appointments
 * Get appointment report for a date range. (admin only)
 */
export async function getAppointmentReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      throw new AppError('Both "from" and "to" query parameters are required.', 400);
    }

    const report = await adminService.getAppointmentReport(from as string, to as string);

    successResponse(res, report, 'Appointment report retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// PATIENT REPORT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/admin/reports/patients
 * Get patient statistics report. (admin only)
 */
export async function getPatientReport(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { from, to } = req.query;

    const report = await adminService.getPatientReport(
      from as string | undefined,
      to as string | undefined
    );

    successResponse(res, report, 'Patient report retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
