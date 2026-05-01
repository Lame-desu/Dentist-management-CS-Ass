import { Request, Response, NextFunction } from 'express';
import * as appointmentService from '../services/appointmentService.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

// ═══════════════════════════════════════════════════════════════
// PATIENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/appointments
 * Patient books a new appointment.
 */
export async function createAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appointment = await appointmentService.createAppointment(req.user!.userId, req.body);

    successResponse(res, appointment, 'Appointment request created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/appointments/my
 * Patient lists own appointments.
 */
export async function getMyAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, from, to, page, limit } = req.query;

    const result = await appointmentService.getPatientAppointments(req.user!.userId, {
      status: status as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    successResponse(res, result, 'Appointments retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/appointments/:id/cancel
 * Patient or receptionist cancels an appointment.
 */
export async function cancelAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await appointmentService.cancelAppointment(
      req.params.id,
      req.user!.userId,
      req.user!.role
    );

    successResponse(res, result, 'Appointment cancelled successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// RECEPTIONIST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/appointments/pending
 * Receptionist views all pending appointments.
 */
export async function getPendingAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appointments = await appointmentService.getPendingAppointments();

    successResponse(res, appointments, 'Pending appointments retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/appointments/:id/review
 * Receptionist reviews an appointment (forward, reject, reassign).
 */
export async function reviewAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action, rejectionReason, newDentistId } = req.body;

    const result = await appointmentService.reviewAppointment(
      req.params.id,
      req.user!.userId,
      action,
      { rejectionReason, newDentistId }
    );

    successResponse(res, result, `Appointment ${action}ed successfully.`);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/appointments/forwarded
 * Receptionist views forwarded appointments (monitoring).
 */
export async function getForwardedAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appointments = await appointmentService.getForwardedAppointments();

    successResponse(res, appointments, 'Forwarded appointments retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/appointments/walk-in
 * Receptionist creates a walk-in appointment.
 */
export async function createWalkInAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appointment = await appointmentService.createWalkInAppointment(req.user!.userId, req.body);

    successResponse(res, appointment, 'Walk-in appointment created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/appointments
 * Receptionist views all appointments with filters.
 */
export async function getAllAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, from, to, dentistId, patientId, page, limit } = req.query;

    const result = await appointmentService.getAllAppointments({
      status: status as string | undefined,
      from: from as string | undefined,
      to: to as string | undefined,
      dentistId: dentistId ? parseInt(dentistId as string, 10) : undefined,
      patientId: patientId ? parseInt(patientId as string, 10) : undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    successResponse(res, result, 'Appointments retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// DENTIST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/appointments/dentist
 * Dentist views own appointments.
 */
export async function getDentistAppointments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, date, from, to, page, limit } = req.query;

    const result = await appointmentService.getDentistAppointments(req.user!.userId, {
      status: status as string | undefined,
      from: (from || date) as string | undefined,
      to: (to || date) as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    successResponse(res, result, 'Dentist appointments retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/appointments/:id/respond
 * Dentist responds to a forwarded appointment (approve, reject, reschedule).
 */
export async function respondToAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { action, rejectionReason, suggestedDate, suggestedTime } = req.body;

    const result = await appointmentService.respondToAppointment(
      req.params.id,
      req.user!.userId,
      action,
      { rejectionReason, suggestedDate, suggestedTime }
    );

    successResponse(res, result, `Appointment ${action}d successfully.`);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/appointments/:id/complete
 * Dentist marks an appointment as completed.
 */
export async function completeAppointment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await appointmentService.completeAppointment(req.params.id, req.user!.userId);

    successResponse(res, result, 'Appointment marked as completed.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/appointments/dentist/schedule
 * Dentist views their day schedule.
 */
export async function getDentistSchedule(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date } = req.query;

    if (!date) {
      throw new AppError('Date query parameter is required.', 400);
    }

    const result = await appointmentService.getDentistSchedule(req.user!.userId, date as string);

    successResponse(res, result, 'Dentist schedule retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// SHARED ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/appointments/:id
 * Get single appointment details (role-based data filtering).
 */
export async function getAppointmentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);

    // Role-based access check
    const role = req.user!.role;
    const userId = req.user!.userId;

    if (role === 'patient') {
      // Patient can only see their own appointments
      const patientCheck = await (await import('../config/database.js')).query(
        'SELECT id FROM patients WHERE user_id = $1', [userId]
      );
      if (patientCheck.rows.length === 0 || patientCheck.rows[0].id !== appointment.patient_id) {
        throw new AppError('Access denied. You can only view your own appointments.', 403);
      }
    } else if (role === 'dentist') {
      // Dentist can only see appointments assigned to them
      const dentistCheck = await (await import('../config/database.js')).query(
        'SELECT id FROM dentists WHERE user_id = $1', [userId]
      );
      if (dentistCheck.rows.length === 0 || dentistCheck.rows[0].id !== appointment.dentist_id) {
        throw new AppError('Access denied. You can only view appointments assigned to you.', 403);
      }
    }
    // Receptionist and Admin can see all

    successResponse(res, appointment, 'Appointment retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/appointments/slots
 * Get available time slots for a dentist on a specific date.
 */
export async function getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dentistId, date } = req.query;

    if (!dentistId || !date) {
      throw new AppError('Both dentistId and date query parameters are required.', 400);
    }

    const slots = await appointmentService.getAvailableSlots(
      parseInt(dentistId as string, 10),
      date as string
    );

    successResponse(res, slots, 'Available slots retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
