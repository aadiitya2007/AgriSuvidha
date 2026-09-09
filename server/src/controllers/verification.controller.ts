import { Response, NextFunction } from 'express';
import { verificationService } from '../services/verification.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateCentreAccess } from '../middleware/rbac.middleware';
import { AppError } from '../middleware/errorHandler.middleware';
import { z } from 'zod';

export const verifyTokenSchema = z.object({
  body: z.object({
    tokenType: z.enum(['QR', 'OTP']),
    tokenValue: z.string().min(1, 'Token value is required'),
    centreId: z.string().uuid(),
  }),
});

export const verifyToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let { tokenType, tokenValue, centreId } = req.body;

    if (!validateCentreAccess(req, centreId)) {
      if (req.user?.centreIds && req.user.centreIds.length > 0) {
        centreId = req.user.centreIds[0];
      } else {
        throw new AppError('You are not authorized to verify tokens for this centre. Please log in as an authorized operator.', 403, 'FORBIDDEN');
      }
    }

    const result = await verificationService.verifyQrOrOtp({
      tokenType,
      tokenValue,
      operatorUserId: req.user!.userId,
      centreId,
    });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
