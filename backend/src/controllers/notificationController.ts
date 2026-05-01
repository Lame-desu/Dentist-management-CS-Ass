import { Request, Response, NextFunction } from 'express';
import * as notificationService from '../services/notificationService.js';
import { successResponse } from '../utils/apiResponse.js';

// ═══════════════════════════════════════════════════════════════
// GET USER NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/notifications
 * Get authenticated user's notifications with optional filters.
 */
export async function getUserNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { isRead, type, page, limit } = req.query;

    const result = await notificationService.getUserNotifications(req.user!.userId, {
      isRead: isRead !== undefined ? isRead === 'true' : undefined,
      type: type as string | undefined,
      page: page ? parseInt(page as string, 10) : undefined,
      limit: limit ? parseInt(limit as string, 10) : undefined,
    });

    successResponse(res, result, 'Notifications retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// GET UNREAD COUNT
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications for the authenticated user.
 */
export async function getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const count = await notificationService.getUnreadCount(req.user!.userId);

    successResponse(res, { unreadCount: count }, 'Unread count retrieved successfully.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// MARK AS READ
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read.
 */
export async function markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationService.markAsRead(req.params.id, req.user!.userId);

    successResponse(res, result, 'Notification marked as read.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// MARK ALL AS READ
// ═══════════════════════════════════════════════════════════════

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read for the authenticated user.
 */
export async function markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationService.markAllAsRead(req.user!.userId);

    successResponse(res, result, 'All notifications marked as read.');
  } catch (error) {
    next(error);
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE NOTIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * DELETE /api/notifications/:id
 * Delete a notification (own only).
 */
export async function deleteNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user!.userId);

    successResponse(res, result, 'Notification deleted successfully.');
  } catch (error) {
    next(error);
  }
}
