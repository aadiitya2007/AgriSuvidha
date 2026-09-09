import { Request, Response, NextFunction } from 'express';
import { queueService } from '../services/queue.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateCentreAccess } from '../middleware/rbac.middleware';
import { AppError } from '../middleware/errorHandler.middleware';
import { sseManager } from '../utils/sse';
import { QueueStatus } from '@prisma/client';

export const getQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await queueService.getCentreQueue(req.params.centreId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const streamQueueSSE = (req: Request, res: Response) => {
  const centreId = req.params.centreId;
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  sseManager.addClient(clientId, centreId, res);
};

export const callNextToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { centreId } = req.body;
    if (!validateCentreAccess(req, centreId)) {
      throw new AppError('You are not authorized for this centre', 403, 'FORBIDDEN');
    }

    const result = await queueService.callNextToken(centreId, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateQueueStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { entryId, status } = req.body;
    const result = await queueService.updateQueueStatus(entryId, status as QueueStatus, req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
