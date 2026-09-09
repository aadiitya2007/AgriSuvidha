import { Router } from 'express';
import {
  registerFarmer,
  requestOtp,
  verifyOtp,
  staffLogin,
  refreshToken,
  getCurrentUser,
  registerFarmerSchema,
  requestOtpSchema,
  verifyOtpSchema,
  staffLoginSchema,
} from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { requireAuth } from '../middleware/auth.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register-farmer', authLimiter, validateRequest(registerFarmerSchema), registerFarmer);
router.post('/request-otp', authLimiter, validateRequest(requestOtpSchema), requestOtp);
router.post('/verify-otp', authLimiter, validateRequest(verifyOtpSchema), verifyOtp);
router.post('/staff-login', authLimiter, validateRequest(staffLoginSchema), staffLogin);
router.post('/refresh-token', refreshToken);
router.get('/me', requireAuth, getCurrentUser);

export default router;
