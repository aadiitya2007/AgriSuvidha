import { Router } from 'express';
import { getCentres, getCentreById, updateCentre } from '../controllers/centre.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireManagerOrAdmin } from '../middleware/rbac.middleware';
import { publicApiLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.get('/', publicApiLimiter, getCentres);
router.get('/:id', publicApiLimiter, getCentreById);
router.patch('/:id', requireAuth, requireManagerOrAdmin, updateCentre);

export default router;
