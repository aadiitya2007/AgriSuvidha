import { Router } from 'express';
import {
  listProcurements,
  getProcurementById,
  submitInspection,
  managerDecision,
  recordInspectionSchema,
} from '../controllers/procurement.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireStaff, requireManagerOrAdmin } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

router.get('/', requireAuth, listProcurements);
router.get('/:id', requireAuth, getProcurementById);
router.post('/inspect', requireAuth, requireStaff, validateRequest(recordInspectionSchema), submitInspection);
router.post('/:id/decision', requireAuth, requireManagerOrAdmin, managerDecision);

export default router;
