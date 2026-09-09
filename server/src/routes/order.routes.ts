import { Router } from 'express';
import { createOrder, listOrders, updateOrderStatus } from '../controllers/order.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireStaff } from '../middleware/rbac.middleware';

const router = Router();

router.post('/', requireAuth, createOrder);
router.get('/', requireAuth, listOrders);
router.patch('/:id/status', requireAuth, requireStaff, updateOrderStatus);

export default router;
