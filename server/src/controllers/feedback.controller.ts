import { Response, NextFunction } from 'express';
import { ticketService } from '../services/ticket.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const submitFeedback = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ticketService.submitFeedback({
      userId: req.user!.userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const listFeedback = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ticketService.listFeedback(req.query.centreId as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
