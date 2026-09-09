import { Router } from 'express';
import {
  getSlots,
  createBooking,
  getMyBookings,
  cancelBooking,
  rescheduleBooking,
  createBookingSchema,
} from '../controllers/booking.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { checkIdempotency } from '../middleware/idempotency.middleware';
import { bookingLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.get('/slots', getSlots);
router.post('/', requireAuth, bookingLimiter, checkIdempotency, validateRequest(createBookingSchema), createBooking);
router.get('/my-bookings', requireAuth, getMyBookings);
router.post('/:id/cancel', requireAuth, cancelBooking);
router.post('/:id/reschedule', requireAuth, rescheduleBooking);

export default router;
