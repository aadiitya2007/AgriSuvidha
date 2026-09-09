import { Router } from 'express';
import authRoutes from './auth.routes';
import centreRoutes from './centre.routes';
import bookingRoutes from './booking.routes';
import queueRoutes from './queue.routes';
import verificationRoutes from './verification.routes';
import procurementRoutes from './procurement.routes';
import paymentRoutes from './payment.routes';
import incidentRoutes from './incident.routes';
import productRoutes from './product.routes';
import orderRoutes from './order.routes';
import ticketRoutes from './ticket.routes';
import feedbackRoutes from './feedback.routes';
import notificationRoutes from './notification.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/centres', centreRoutes);
router.use('/bookings', bookingRoutes);
router.use('/queue', queueRoutes);
router.use('/verification', verificationRoutes);
router.use('/procurement', procurementRoutes);
router.use('/payments', paymentRoutes);
router.use('/incidents', incidentRoutes);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/tickets', ticketRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
