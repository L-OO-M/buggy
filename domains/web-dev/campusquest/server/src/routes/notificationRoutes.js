import { Router } from 'express';
import * as notifications from '../controllers/notificationController.js';
import { authenticate, requireOrganizer, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/error.js';
import { announcementSchema } from '../validators/schemas.js';

const router = Router();

router.get('/', authenticate, notifications.listNotifications);
router.get('/unread-count', authenticate, notifications.unreadCount);
router.patch('/read-all', authenticate, notifications.markAllRead);
router.post('/announcements', authenticate, requireOrganizer, validate(announcementSchema), notifications.sendAnnouncement);
router.post('/broadcast', authenticate, requireRole('admin'), validate(announcementSchema), notifications.adminBroadcast);
router.patch('/:id/read', authenticate, notifications.markRead);
router.delete('/:id', authenticate, notifications.deleteNotification);

export default router;
