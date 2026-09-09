import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { z } from 'zod';

export const registerFarmerSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email().optional().or(z.literal('')),
    village: z.string().min(2, 'Village is required'),
    district: z.string().min(2, 'District is required'),
    state: z.string().min(2, 'State is required'),
    pincode: z.string().length(6, 'Pincode must be 6 digits'),
    farmSizeAcres: z.number().positive().default(2.5),
    preferredLanguage: z.enum(['en', 'hi', 'mr']).default('en'),
    farmerRegistrationNumber: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankIfsc: z.string().optional(),
    consentCommunications: z.boolean().default(true),
  }),
});

export const requestOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: z.string().min(10),
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const staffLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const registerFarmer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.registerFarmer(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const requestOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.requestFarmerOtp(req.body.phone);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.verifyFarmerOtp(req.body.phone, req.body.otp);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const staffLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.staffLogin(req.body.email, req.body.password);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshTokens(refreshToken);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const result = await authService.getCurrentUser(req.user!.userId);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
