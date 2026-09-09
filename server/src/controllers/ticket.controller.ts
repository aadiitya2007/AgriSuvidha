import { Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { TicketStatus, TicketPriority } from '@prisma/client';

export const createTicket = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ticketService.createTicket({
      userId: req.user!.userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const listTickets = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isFarmer = req.user!.role === 'FARMER';
    const filter: any = {
      status: req.query.status as TicketStatus,
    };

    if (isFarmer) {
      filter.userId = req.user!.userId;
    } else if (req.query.centreId) {
      filter.centreId = req.query.centreId as string;
    }

    const result = await ticketService.listTickets(filter);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const addTicketComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isStaff = req.user!.role !== 'FARMER';
    const result = await ticketService.addComment({
      ticketId: req.params.id,
      userId: req.user!.userId,
      message: req.body.message,
      isStaff,
      updateStatus: req.body.status as TicketStatus,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
