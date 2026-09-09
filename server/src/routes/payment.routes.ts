import { Router } from 'express';
import { listPayments, disbursePayment, exportPaymentReportCsv } from '../controllers/payment.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requireManagerOrAdmin } from '../middleware/rbac.middleware';
import { checkIdempotency } from '../middleware/idempotency.middleware';

const router = Router();

router.get('/', requireAuth, listPayments);
router.post('/disburse', requireAuth, requireManagerOrAdmin, checkIdempotency, disbursePayment);
router.get('/export/csv', requireAuth, requireManagerOrAdmin, exportPaymentReportCsv);

export default router;
