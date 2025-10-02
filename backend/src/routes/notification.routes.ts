import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as NotificationController from '../controllers/notification.controller';

const router = Router();

// Get all unread notifications for the current user
router.get('/',
  authenticate,
  NotificationController.getNotifications
);

// Mark a notification as read
router.post('/:notificationId/read',
  authenticate,
  NotificationController.markAsRead
);

// Mark all notifications as read
router.post('/read-all',
  authenticate,
  NotificationController.markAllAsRead
);

// Archive a notification
router.post('/:notificationId/archive',
  authenticate,
  NotificationController.archiveNotification
);

export default router;