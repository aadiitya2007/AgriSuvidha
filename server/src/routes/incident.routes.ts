import { Router } from 'express';
import { listIncidents, reportIncident, addIncidentUpdate } from '../controllers/incident.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireStaff } from '../middleware/rbac.middleware';

const router = Router();

router.get('/', listIncidents);
router.post('/', requireAuth, requireStaff, reportIncident);
router.post('/:id/updates', requireAuth, requireStaff, addIncidentUpdate);

export default router;
