import { Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { OrderStatus } from '@prisma/client';

export const createOrder = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { centreId } = req.body;
    const result = await marketplaceService.createOrder(req.user!.userId, centreId);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const listOrders = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const isFarmer = req.user!.role === 'FARMER';
    if (isFarmer) {
      const result = await marketplaceService.listFarmerOrders(req.user!.userId);
      return res.status(200).json({ success: true, data: result });
    }
    const result = await marketplaceService.listAllOrders(req.query.centreId as string);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateOrderStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const result = await marketplaceService.updateOrderStatus(
      req.params.id,
      status as OrderStatus,
      req.user!.userId
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
