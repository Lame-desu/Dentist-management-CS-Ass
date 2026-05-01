import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  notificationIdValidation,
  listNotificationsValidation,
} from '../middleware/validators/notificationValidators.js';

const router = Router();

// ─── All routes require authentication ───────────────────────
router.use(authenticate);

// GET /api/notifications — Get user's notifications (any authenticated)
router.get(
  '/',
  validate(listNotificationsValidation),
  notificationController.getUserNotifications
);

// GET /api/notifications/unread-count — Get unread count (any authenticated)
router.get(
  '/unread-count',
  notificationController.getUnreadCount
);

// PATCH /api/notifications/read-all — Mark all as read (own)
// Must be before /:id routes
router.patch(
  '/read-all',
  notificationController.markAllAsRead
);

// PATCH /api/notifications/:id/read — Mark as read (own notifications)
router.patch(
  '/:id/read',
  validate(notificationIdValidation),
  notificationController.markAsRead
);

// DELETE /api/notifications/:id — Delete notification (own)
router.delete(
  '/:id',
  validate(notificationIdValidation),
  notificationController.deleteNotification
);

export default router;
