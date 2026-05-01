import { Request, Response, NextFunction } from 'express';
import * as prescriptionService from '../services/prescriptionService.js';
import { successResponse } from '../utils/apiResponse.js';

// ═══════════════════════════════════════════════════════════════
// DENTIST ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/prescriptions
 * Dentist adds a single prescription to a dental record.
 */
export async function createPrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dentalRecordId, ...prescriptionData } = req.body;

    const prescription = await prescriptionService.createPrescription(
      req.user!.userId,
      dentalRecordId,
      prescriptionData
    );

    successResponse(res, prescription, 'Prescription created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/prescriptions/bulk
 * Dentist adds multiple prescriptions at once.
 */
export async function createBulkPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dentalRecordId, prescriptions } = req.body;

    const createdPrescriptions = await prescriptionService.createBulkPrescriptions(
      req.user!.userId,
      dentalRecordId,
      prescriptions
    );

    successResponse(res, createdPrescriptions, 'Prescriptions created successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/prescriptions/:id
 * Dentist updates a prescription.
 */
export async function updatePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prescription = await prescriptionService.updatePrescription(
      parseInt(req.params.id, 10),
      req.user!.userId,
      req.body
    );

    successResponse(res, prescription, 'Prescription updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/prescriptions/:id
 * Dentist deletes a prescription.
 */
export async function deletePrescription(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await prescriptionService.deletePrescription(
      parseInt(req.params.id, 10),
      req.user!.userId
    );

    successResponse(res, result, 'Prescription deleted successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// READ ENDPOINTS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/prescriptions/record/:recordId
 * Get all prescriptions for a dental record.
 */
export async function getPrescriptionsByRecord(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prescriptions = await prescriptionService.getPrescriptionsByRecord(
      parseInt(req.params.recordId, 10)
    );

    successResponse(res, prescriptions, 'Prescriptions retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/prescriptions/my
 * Patient views all their prescriptions grouped by dental record.
 */
export async function getMyPrescriptions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const prescriptions = await prescriptionService.getPrescriptionsByPatient(req.user!.userId);

    successResponse(res, prescriptions, 'Prescriptions retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
