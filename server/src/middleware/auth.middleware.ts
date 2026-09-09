import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { AppError } from './errorHandler.middleware';
import { prisma } from '../prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { centreIds?: string[] };
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Missing or malformed Authorization header', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Fetch user's assigned centres if operator/manager
    let centreIds: string[] = [];
    if (decoded.role === 'CENTRE_OPERATOR' || decoded.role === 'CENTRE_MANAGER') {
      const userRecord = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { staffAssignments: true },
      });

      if (!userRecord) {
        return next(new AppError('Your session has expired or the user record is invalid. Please log in again.', 401, 'INVALID_SESSION'));
      }

      centreIds = userRecord.staffAssignments.map((a) => a.centreId);
    }

    req.user = {
      ...decoded,
      centreIds,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Authentication token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Invalid authentication token', 401, 'INVALID_TOKEN'));
  }
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }
  } catch (err) {
    // Ignore error for optional auth
  }
  next();
};
