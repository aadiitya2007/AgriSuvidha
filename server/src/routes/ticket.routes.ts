import { Router } from 'express';
import { createTicket, listTickets, addTicketComment } from '../controllers/ticket.controller';
import { requireAuth } from '../middleware/auth.middleware';

const router = Router();

router.post('/', requireAuth, createTicket);
router.get('/', requireAuth, listTickets);
router.post('/:id/comments', requireAuth, addTicketComment);

export default router;
