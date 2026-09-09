import { Request, Response, NextFunction } from 'express';
import { marketplaceService } from '../services/marketplace.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, search } = req.query;
    const result = await marketplaceService.listProducts(
      categoryId as string,
      search as string
    );
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const listCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await marketplaceService.listCategories();
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await marketplaceService.getCart(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const addToCart = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const result = await marketplaceService.addToCart(req.user!.userId, productId, quantity || 1);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const updateCartItem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { productId, quantity } = req.body;
    const result = await marketplaceService.updateCartItem(req.user!.userId, productId, quantity);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
