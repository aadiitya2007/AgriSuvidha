import { Router } from 'express';
import { getQueue, streamQueueSSE, callNextToken, updateQueueStatus } from '../controllers/queue.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireStaff } from '../middleware/rbac.middleware';

const router = Router();

router.get('/:centreId', getQueue);
router.get('/:centreId/stream', streamQueueSSE);
router.post('/call-next', requireAuth, requireStaff, callNextToken);
router.post('/status', requireAuth, requireStaff, updateQueueStatus);

export default router;
