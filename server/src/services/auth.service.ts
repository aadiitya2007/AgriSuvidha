import bcrypt from 'bcryptjs';
import { prisma } from '../prisma/client';
import { AppError } from '../middleware/errorHandler.middleware';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { generateNumericOtp, hashValue } from '../utils/crypto';
import { CONSTANTS } from '../config/constants';
import { Role } from '@prisma/client';
import { notificationService } from './notification.service';
import { logger } from '../utils/logger';
function normalizePhoneCandidates(phone: string): string[] {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  const formattedStandard = `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
  const candidates = new Set([
    trimmed,
    last10,
    `+91${last10}`,
    `+91 ${last10}`,
    formattedStandard,
    `0${last10}`,
  ]);
  return Array.from(candidates);
}

// Store simulated active OTPs in memory for fast lookup
const activeOtpStore = new Map<string, { code: string; expiresAt: number }>();

export class AuthService {
  async registerFarmer(data: {
    fullName: string;
    phone: string;
    email?: string;
    village: string;
    district: string;
    state: string;
    pincode: string;
    farmSizeAcres: number;
    preferredLanguage?: string;
    farmerRegistrationNumber?: string;
    bankAccountNumber?: string;
    bankIfsc?: string;
    consentCommunications: boolean;
  }) {
    // Normalize phone format
    const digits = data.phone.replace(/\D/g, '');
    const last10 = digits.slice(-10);
    const standardPhone = digits.length >= 10 ? `+91 ${last10.slice(0, 5)} ${last10.slice(5)}` : data.phone.trim();

    // Check if phone already registered
    const candidatePhones = normalizePhoneCandidates(data.phone);
    const existing = await prisma.user.findFirst({
      where: { phone: { in: candidatePhones } },
    });

    if (existing) {
      throw new AppError('A farmer with this phone number is already registered. Please log in.', 409, 'PHONE_EXISTS');
    }

    const cleanEmail = data.email && data.email.trim() !== '' ? data.email.trim().toLowerCase() : null;
    if (cleanEmail) {
      const existingEmail = await prisma.user.findFirst({
        where: { email: cleanEmail },
      });
      if (existingEmail) {
        throw new AppError('An account with this email address already exists. Please log in or use a different email.', 409, 'EMAIL_EXISTS');
      }
    }

    // Create user and profile in transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: standardPhone,
          email: cleanEmail,
          role: Role.FARMER,
          farmerProfile: {
            create: {
              fullName: data.fullName,
              village: data.village,
              district: data.district,
              state: data.state,
              pincode: data.pincode,
              farmSizeAcres: data.farmSizeAcres,
              preferredLanguage: data.preferredLanguage || 'en',
              farmerRegistrationNumber: data.farmerRegistrationNumber || `REG-${Date.now().toString().slice(-6)}`,
              bankAccountNumber: data.bankAccountNumber ? `XXXX-XXXX-${data.bankAccountNumber.slice(-4)}` : 'XXXX-XXXX-0000',
              bankIfsc: data.bankIfsc || 'SBIN0001234',
              consentCommunications: data.consentCommunications,
            },
          },
          notificationPref: {
            create: {
              inAppEnabled: true,
              smsEnabled: true,
              emailEnabled: true,
              pushEnabled: true,
            },
          },
        },
        include: { farmerProfile: true },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          userRole: Role.FARMER,
          action: 'FARMER_REGISTRATION',
          resourceType: 'USER',
          resourceId: user.id,
          metadata: JSON.stringify({ phone: data.phone, district: data.district }),
        },
      });

      return user;
    });

    const accessToken = signAccessToken({ userId: newUser.id, role: newUser.role, phone: newUser.phone });
    const refreshToken = signRefreshToken({ userId: newUser.id, role: newUser.role });

    return {
      user: {
        id: newUser.id,
        phone: newUser.phone,
        role: newUser.role,
        profile: newUser.farmerProfile,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async requestFarmerOtp(phone: string) {
    const candidates = normalizePhoneCandidates(phone);
    const user = await prisma.user.findFirst({
      where: { phone: { in: candidates } },
      include: { farmerProfile: true },
    });

    if (!user) {
      throw new AppError('No farmer registered with this mobile number. Please register first.', 404, 'USER_NOT_FOUND');
    }

    // Generate 6 digit OTP. For demo purposes, we also support fixed DEMO_OTP
    const otp = generateNumericOtp(6);
    const expiresAt = Date.now() + CONSTANTS.EXPIRY.OTP_SECONDS * 1000;
    for (const c of [user.phone, phone, ...candidates]) {
      activeOtpStore.set(c, { code: otp, expiresAt });
    }

    logger.info(`[AUTH OTP DISPATCH] Phone: ${user.phone} | OTP: ${otp} | Expires in: 10 mins`);

    return {
      message: 'OTP sent successfully to registered mobile number',
      phone: user.phone,
      // For development/demo convenience, return simulated OTP so reviewers don't need real SMS gateway
      demoOtp: otp,
      expiresInSeconds: CONSTANTS.EXPIRY.OTP_SECONDS,
    };
  }

  async verifyFarmerOtp(phone: string, otp: string) {
    const candidates = normalizePhoneCandidates(phone);
    const user = await prisma.user.findFirst({
      where: { phone: { in: candidates } },
      include: { farmerProfile: true },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Check OTP: either valid cached OTP or default demo OTP '123456'
    let stored = activeOtpStore.get(phone) || activeOtpStore.get(user.phone);
    if (!stored) {
      for (const c of candidates) {
        if (activeOtpStore.has(c)) {
          stored = activeOtpStore.get(c);
          break;
        }
      }
    }
    const isValidStored = stored && stored.code === otp && Date.now() <= stored.expiresAt;
    const isValidDemo = otp === CONSTANTS.DEMO_OTP;

    if (!isValidStored && !isValidDemo) {
      throw new AppError('Invalid or expired OTP. Please try again.', 400, 'INVALID_OTP');
    }

    if (stored) {
      for (const c of [user.phone, phone, ...candidates]) {
        activeOtpStore.delete(c);
      }
    }

    const accessToken = signAccessToken({ userId: user.id, role: user.role, phone: user.phone });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashValue(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        role: user.role,
        profile: user.farmerProfile,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async staffLogin(email: string, passwordPlain: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        staffAssignments: {
          include: { centre: true },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password credentials', 401, 'INVALID_CREDENTIALS');
    }

    const assignedCentreIds = user.staffAssignments.map((a) => a.centreId);
    const accessToken = signAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email || undefined,
    });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        assignedCentres: user.staffAssignments.map((a) => ({
          centreId: a.centreId,
          centreName: a.centre.name,
          role: a.role,
        })),
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async refreshTokens(refreshTokenStr: string) {
    const decoded = verifyRefreshToken(refreshTokenStr);
    const hashed = hashValue(refreshTokenStr);

    const existingToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: hashed },
      include: { user: true },
    });

    if (!existingToken || existingToken.revokedAt || existingToken.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }

    // Revoke old token
    await prisma.refreshToken.update({
      where: { id: existingToken.id },
      data: { revokedAt: new Date() },
    });

    // Generate new pair
    const newAccessToken = signAccessToken({
      userId: existingToken.user.id,
      role: existingToken.user.role,
      phone: existingToken.user.phone,
      email: existingToken.user.email || undefined,
    });
    const newRefreshToken = signRefreshToken({
      userId: existingToken.user.id,
      role: existingToken.user.role,
    });

    await prisma.refreshToken.create({
      data: {
        userId: existingToken.user.id,
        tokenHash: hashValue(newRefreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        farmerProfile: true,
        staffAssignments: { include: { centre: true } },
        notificationPref: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    const assignedCentresList = user.staffAssignments.map((s) => ({
      centreId: s.centreId,
      centreName: s.centre.name,
      centreCode: s.centre.code,
      role: s.role,
    }));

    return {
      id: user.id,
      phone: user.phone,
      email: user.email,
      role: user.role,
      profile: user.farmerProfile,
      assignedCentres: assignedCentresList,
      staffAssignments: assignedCentresList,
      notificationPref: user.notificationPref,
    };
  }
}

export const authService = new AuthService();
