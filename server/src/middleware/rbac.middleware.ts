import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { AppError } from './errorHandler.middleware';
import { Role } from '@prisma/client';

export const requireRole = (...allowedRoles: Role[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(
        new AppError(
          `Access forbidden: Requires role ${allowedRoles.join(' or ')}. Your role is ${req.user.role}`,
          403,
          'FORBIDDEN'
        )
      );
    }

    next();
  };
};

export const requireStaff = requireRole(
  Role.CENTRE_OPERATOR,
  Role.CENTRE_MANAGER,
  Role.PLATFORM_ADMIN
);

export const requireManagerOrAdmin = requireRole(
  Role.CENTRE_MANAGER,
  Role.PLATFORM_ADMIN
);

export const requireAdmin = requireRole(Role.PLATFORM_ADMIN);

/**
 * Validates that an operator or manager has explicit assignment to the requested centreId.
 * Platform Admin bypasses centre-scoping restriction.
 */
export const validateCentreAccess = (req: AuthenticatedRequest, centreId: string): boolean => {
  if (!req.user) return false;
  if (req.user.role === Role.PLATFORM_ADMIN) return true;
  if (!req.user.centreIds || req.user.centreIds.length === 0) return false;
  return req.user.centreIds.includes(centreId);
};
