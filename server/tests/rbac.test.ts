import { describe, it, expect } from 'vitest';
import { validateCentreAccess } from '../src/middleware/rbac.middleware';
import { Role } from '@prisma/client';

describe('RBAC & IDOR Scope Protection Tests', () => {
  it('should allow platform admin to access any centre', () => {
    const mockAdminReq: any = {
      user: {
        userId: 'admin-1',
        role: Role.PLATFORM_ADMIN,
        centreIds: [],
      },
    };

    expect(validateCentreAccess(mockAdminReq, 'centre-nagpur')).toBe(true);
    expect(validateCentreAccess(mockAdminReq, 'centre-pune')).toBe(true);
  });

  it('should allow operator to access only their assigned centre', () => {
    const mockOperatorReq: any = {
      user: {
        userId: 'operator-1',
        role: Role.CENTRE_OPERATOR,
        centreIds: ['centre-nagpur'],
      },
    };

    expect(validateCentreAccess(mockOperatorReq, 'centre-nagpur')).toBe(true);
    expect(validateCentreAccess(mockOperatorReq, 'centre-nashik')).toBe(false);
  });

  it('should deny unauthenticated requests', () => {
    const mockUnauthReq: any = {};
    expect(validateCentreAccess(mockUnauthReq, 'centre-nagpur')).toBe(false);
  });
});
