import { Request, Response, NextFunction } from 'express';
import * as clinicConfigService from '../services/clinicConfigService.js';
import { successResponse } from '../utils/apiResponse.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * GET /api/config
 * Get all clinic configuration values.
 * Accessible to any authenticated user.
 */
export async function getAllConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const config = await clinicConfigService.getAllConfigDetailed();

    successResponse(res, config, 'Clinic configuration retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/config/working-hours
 * Get parsed working hours (convenience endpoint).
 */
export async function getWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workingHours = await clinicConfigService.getWorkingHours();

    successResponse(res, workingHours, 'Working hours retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/config/:key
 * Admin updates a single config value.
 */
export async function updateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value && value !== '') {
      throw new AppError('Value is required in the request body.', 400);
    }

    const result = await clinicConfigService.updateConfig(key, value);

    successResponse(res, result, `Configuration '${key}' updated successfully.`);
  } catch (error) {
    next(error);
  }
}
