import { Response, NextFunction } from 'express';
import { incidentService } from '../services/incident.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateCentreAccess } from '../middleware/rbac.middleware';
import { AppError } from '../middleware/errorHandler.middleware';
import { IncidentStatus } from '@prisma/client';

export const listIncidents = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await incidentService.listIncidents({
      centreId: req.query.centreId as string,
      status: req.query.status as IncidentStatus,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const reportIncident = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { centreId } = req.body;
    if (!validateCentreAccess(req, centreId)) {
      throw new AppError('You are not authorized to report incidents for this centre', 403, 'FORBIDDEN');
    }

    const result = await incidentService.reportIncident({
      ...req.body,
      reportedByUserId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const addIncidentUpdate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { message, isResolved } = req.body;
    const result = await incidentService.addIncidentUpdate({
      incidentId: req.params.id,
      userId: req.user!.userId,
      message,
      isResolved,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
