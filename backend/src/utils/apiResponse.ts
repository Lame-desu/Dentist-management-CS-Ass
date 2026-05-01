import { Response } from 'express';

interface ApiSuccessResponse<T = unknown> {
  success: true;
  message: string;
  data: T;
}

interface ApiErrorResponse {
  success: false;
  message: string;
  error?: unknown;
}

/**
 * Send a standardized success response.
 */
export function successResponse<T = unknown>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response<ApiSuccessResponse<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Send a standardized error response.
 */
export function errorResponse(
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 500,
  error?: unknown
): Response<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    message,
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error;
  }

  return res.status(statusCode).json(response);
}
