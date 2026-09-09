import { Response, NextFunction } from 'express';
import { procurementService } from '../services/procurement.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateCentreAccess } from '../middleware/rbac.middleware';
import { AppError } from '../middleware/errorHandler.middleware';
import { ProcurementStatus } from '@prisma/client';
import { z } from 'zod';

export const recordInspectionSchema = z.object({
  body: z.object({
    bookingId: z.string().uuid(),
    submittedWeight: z.number().positive(),
    moistureContent: z.number().min(0).max(100),
    foreignMatterPercent: z.number().min(0).max(100),
    inspectionNotes: z.string().optional(),
    lineItems: z.array(z.object({
      bagBatchNumber: z.string(),
      bagCount: z.number().int().positive(),
      grossWeightKg: z.number().positive(),
      tareWeightKg: z.number().min(0),
      netWeightKg: z.number().positive(),
    })).optional(),
  }),
});

export const listProcurements = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isFarmer = req.user!.role === 'FARMER';
    const filter: any = {
      status: req.query.status as ProcurementStatus,
      receiptNumber: req.query.receiptNumber as string,
    };

    if (isFarmer) {
      filter.farmerId = req.user!.userId;
    } else if (req.query.centreId) {
      filter.centreId = req.query.centreId as string;
    }

    const result = await procurementService.listRecords(filter);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getProcurementById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await procurementService.getRecordById(req.params.id);
    if (req.user!.role === 'FARMER' && result.farmerId !== req.user!.userId) {
      throw new AppError('Unauthorized: You do not own this procurement record', 403, 'FORBIDDEN');
    }
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const submitInspection = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await procurementService.recordInspection({
      ...req.body,
      operatorUserId: req.user!.userId,
    });
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const managerDecision = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { action, notes } = req.body;
    const result = await procurementService.managerDecision({
      recordId: req.params.id,
      managerUserId: req.user!.userId,
      action,
      notes,
    });
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
