import { Router } from 'express';
import { submitFeedback, listFeedback } from '../controllers/feedback.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, submitFeedback);
router.get('/', listFeedback);

export default router;
