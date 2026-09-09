import { Router } from 'express';
import {
  listNotifications,
  markAsRead,
  getPreferences,
  updatePreferences,
} from '../controllers/notification.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.get('/', requireAuth, listNotifications);
router.patch('/:id/read', requireAuth, markAsRead);
router.get('/preferences', requireAuth, getPreferences);
router.put('/preferences', requireAuth, updatePreferences);

export default router;
