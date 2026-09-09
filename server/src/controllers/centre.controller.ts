import { Request, Response, NextFunction } from 'express';
import { centreService } from '../services/centre.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateCentreAccess } from '../middleware/rbac.middleware';
import { AppError } from '../middleware/errorHandler.middleware';
import { OperationalStatus } from '@prisma/client';

export const getCentres = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { district, pincode, commodityId, status, search, lat, lng } = req.query;
    const result = await centreService.listCentres({
      district: district as string,
      pincode: pincode as string,
      commodityId: commodityId as string,
      status: status as OperationalStatus,
      search: search as string,
      lat: lat ? parseFloat(lat as string) : undefined,
      lng: lng ? parseFloat(lng as string) : undefined,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getCentreById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await centreService.getCentreById(req.params.id);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateCentre = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const centreId = req.params.id;
    if (!validateCentreAccess(req, centreId)) {
      throw new AppError('You are not authorized to configure this centre', 403, 'FORBIDDEN');
    }

    const result = await centreService.updateCentreStatus(centreId, req.body);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
