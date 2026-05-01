import { Request, Response, NextFunction } from 'express';
import * as dentalRecordService from '../services/dentalRecordService.js';
import { successResponse } from '../utils/apiResponse.js';

// ═══════════════════════════════════════════════════════════════
// DENTIST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/dental-records
 * Dentist creates a dental record (optionally with inline prescriptions).
 */
export async function createRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await dentalRecordService.createRecord(req.user!.userId, req.body);

    successResponse(res, record, 'Dental record created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/dental-records/:id
 * Dentist updates their own dental record.
 */
export async function updateRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await dentalRecordService.updateRecord(
      parseInt(req.params.id, 10),
      req.user!.userId,
      req.body
    );

    successResponse(res, record, 'Dental record updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dental-records/dentist/my
 * Dentist views records they created.
 */
export async function getMyDentistRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await dentalRecordService.getRecordsByDentist(req.user!.userId);

    successResponse(res, records, 'Dentist records retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// PATIENT ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/dental-records/my
 * Patient views their own dental records.
 */
export async function getMyRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await dentalRecordService.getMyRecords(req.user!.userId);

    successResponse(res, records, 'Dental records retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// SHARED ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/dental-records/patient/:patientId
 * Get dental records by patient ID (role-based access).
 */
export async function getRecordsByPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const records = await dentalRecordService.getRecordsByPatient(
      parseInt(req.params.patientId, 10),
      req.user!.userId,
      req.user!.role
    );

    successResponse(res, records, 'Patient dental records retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/dental-records/:id
 * Get a single dental record with prescriptions (role-based access).
 */
export async function getRecordById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const record = await dentalRecordService.getRecordById(
      parseInt(req.params.id, 10),
      req.user!.userId,
      req.user!.role
    );

    successResponse(res, record, 'Dental record retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
