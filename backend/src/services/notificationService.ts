import { query } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';

// ─── Interfaces ──────────────────────────────────────────────

interface NotificationFilters {
  isRead?: boolean;
  type?: string;
  page?: number;
  limit?: number;
}

// ═══════════════════════════════════════════════════════════════
// CREATE NOTIFICATION (shared utility)
// ═══════════════════════════════════════════════════════════════

/**
 * Create a notification record.
 * This is the centralized function used by all services to send notifications.
 */
export async function createNotification(
  userId: number,
  title: string,
  message: string,
  type: string,
  relatedAppointmentId?: number
): Promise<void> {
  await query(
    `INSERT INTO notifications (user_id, title, message, type, related_appointment_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, title, message, type, relatedAppointmentId || null]
  );
}

// ═══════════════════════════════════════════════════════════════
// GET USER NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Get all notifications for a user with optional filters and pagination.
 * Sorted newest first.
 */
export async function getUserNotifications(userId: string, filters: NotificationFilters = {}) {
  const { isRead, type, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  const conditions: string[] = ['n.user_id = $1'];
  const params: unknown[] = [userId];
  let paramIdx = 2;

  if (isRead !== undefined) {
    conditions.push(`n.is_read = $${paramIdx++}`);
    params.push(isRead);
  }
  if (type) {
    conditions.push(`n.type = $${paramIdx++}`);
    params.push(type);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  // Count
  const countResult = await query(
    `SELECT COUNT(*) FROM notifications n ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count, 10);

  // Fetch
  const notificationsResult = await query(
    `SELECT n.*
     FROM notifications n
     ${whereClause}
     ORDER BY n.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    [...params, limit, offset]
  );

  return {
    notifications: notificationsResult.rows,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
}

// ═══════════════════════════════════════════════════════════════
// GET UNREAD COUNT
// ═══════════════════════════════════════════════════════════════

/**
 * Get the count of unread notifications for a user.
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const result = await query(
    'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return parseInt(result.rows[0].count, 10);
}

// ═══════════════════════════════════════════════════════════════
// MARK AS READ
// ═══════════════════════════════════════════════════════════════

/**
 * Mark a single notification as read.
 * Validates that the notification belongs to the requesting user.
 */
export async function markAsRead(notificationId: string, userId: string) {
  const result = await query(
    'SELECT * FROM notifications WHERE id = $1',
    [notificationId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found.', 404);
  }

  const notification = result.rows[0];

  if (notification.user_id.toString() !== userId) {
    throw new AppError('You can only manage your own notifications.', 403);
  }

  await query(
    'UPDATE notifications SET is_read = true WHERE id = $1',
    [notificationId]
  );

  return { id: notification.id, is_read: true };
}

// ═══════════════════════════════════════════════════════════════
// MARK ALL AS READ
// ═══════════════════════════════════════════════════════════════

/**
 * Mark all notifications for a user as read.
 */
export async function markAllAsRead(userId: string) {
  const result = await query(
    'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
    [userId]
  );

  return { updated: result.rowCount || 0 };
}

// ═══════════════════════════════════════════════════════════════
// DELETE NOTIFICATION
// ═══════════════════════════════════════════════════════════════

/**
 * Delete a notification.
 * Validates that the notification belongs to the requesting user.
 */
export async function deleteNotification(notificationId: string, userId: string) {
  const result = await query(
    'SELECT * FROM notifications WHERE id = $1',
    [notificationId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Notification not found.', 404);
  }

  const notification = result.rows[0];

  if (notification.user_id.toString() !== userId) {
    throw new AppError('You can only delete your own notifications.', 403);
  }

  await query('DELETE FROM notifications WHERE id = $1', [notificationId]);

  return { id: notification.id, deleted: true };
}
