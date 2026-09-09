import { Router } from 'express';
import { verifyToken, verifyTokenSchema } from '../controllers/verification.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireStaff } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';

const router = Router();

router.post('/verify', requireAuth, requireStaff, validateRequest(verifyTokenSchema), verifyToken);

export default router;
