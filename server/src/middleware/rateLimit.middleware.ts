import rateLimit from 'express-rate-limit';
import { CONSTANTS } from '../config/constants';

export const authLimiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMITS.AUTH_WINDOW_MS,
  max: CONSTANTS.RATE_LIMITS.AUTH_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: CONSTANTS.RATE_LIMITS.BOOKING_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many booking attempts. Please wait a moment before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const publicApiLimiter = rateLimit({
  windowMs: CONSTANTS.RATE_LIMITS.PUBLIC_WINDOW_MS,
  max: CONSTANTS.RATE_LIMITS.PUBLIC_MAX_REQUESTS,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please slow down.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
