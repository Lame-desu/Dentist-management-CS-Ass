import { Request, Response, NextFunction } from 'express';
import * as queueService from '../services/queueService.js';
import { successResponse } from '../utils/apiResponse.js';

// ═══════════════════════════════════════════════════════════════
// ADD TO QUEUE
// ═══════════════════════════════════════════════════════════════

/**
 * POST /api/queue
 * Add an approved appointment to today's queue. (receptionist only)
 */
export async function addToQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { appointmentId } = req.body;
    const result = await queueService.addToQueue(appointmentId, req.user!.userId);

    successResponse(res, result, 'Patient added to queue successfully.', 201);
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// GET TODAY'S QUEUE
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/queue/today
 * Get today's queue entries with optional dentist filter.
 */
export async function getTodayQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { dentistId } = req.query;

    const result = await queueService.getTodayQueue(
      dentistId ? parseInt(dentistId as string, 10) : undefined
    );

    successResponse(res, result, "Today's queue retrieved successfully.");
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// CALL PATIENT
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/queue/:id/call
 * Mark patient as being seen (in_progress). (receptionist only)
 */
export async function callPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await queueService.callPatient(req.params.id, req.user!.userId);

    successResponse(res, result, 'Patient called successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPLETE QUEUE ENTRY
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/queue/:id/complete
 * Mark queue entry as completed. (receptionist or dentist)
 */
export async function completeQueueEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await queueService.completeQueueEntry(req.params.id);

    successResponse(res, result, 'Queue entry completed.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// CANCEL QUEUE ENTRY
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/queue/:id/cancel
 * Cancel queue entry (patient left). (receptionist only)
 */
export async function cancelQueueEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await queueService.cancelQueueEntry(req.params.id);

    successResponse(res, result, 'Queue entry cancelled.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// QUEUE STATS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/queue/stats
 * Get queue statistics. Query: ?date=YYYY-MM-DD (receptionist + admin)
 */
export async function getQueueStats(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { date } = req.query;
    const result = await queueService.getQueueStats(date as string | undefined);

    successResponse(res, result, 'Queue statistics retrieved successfully.');
  } catch (error) {
    next(error);
  }
}
