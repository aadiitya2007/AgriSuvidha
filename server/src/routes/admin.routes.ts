import { Router } from 'express';
import { getAdminAnalytics, getAuditLogs, listUsers } from '../controllers/admin.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireManagerOrAdmin } from '../middleware/rbac.middleware';

const router = Router();

router.get('/analytics', requireAuth, requireManagerOrAdmin, getAdminAnalytics);
router.get('/audit-logs', requireAuth, requireManagerOrAdmin, getAuditLogs);
router.get('/users', requireAuth, requireManagerOrAdmin, listUsers);

export default router;
