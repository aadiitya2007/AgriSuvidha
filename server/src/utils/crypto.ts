import crypto from 'crypto';
import { ENV } from '../config/env';

export interface QRPayload {
  bookingId: string;
  farmerId: string;
  centreId: string;
  nonce: string;
  expiresAt: number; // Unix timestamp in ms
}

export const generateNumericOtp = (length: number = 6): string => {
  const digits = '0123456789';
  let otp = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    otp += digits[randomBytes[i] % 10];
  }
  return otp;
};

export const hashValue = (value: string): string => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

export const signQrToken = (payload: QRPayload): string => {
  const payloadStr = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', ENV.QR_SIGNING_SECRET)
    .update(payloadStr)
    .digest('base64url');

  const combined = JSON.stringify({ p: payload, s: signature });
  return Buffer.from(combined).toString('base64url');
};

export const verifyAndDecodeQrToken = (tokenString: string): { valid: boolean; payload?: QRPayload; error?: string } => {
  try {
    const raw = Buffer.from(tokenString, 'base64url').toString('utf8');
    const { p, s } = JSON.parse(raw);
    if (!p || !s) {
      return { valid: false, error: 'Malformed QR payload format' };
    }

    const payloadStr = JSON.stringify(p);
    const expectedSignature = crypto
      .createHmac('sha256', ENV.QR_SIGNING_SECRET)
      .update(payloadStr)
      .digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(s), Buffer.from(expectedSignature))) {
      return { valid: false, error: 'Invalid cryptographic signature. QR code is forged or modified.' };
    }

    if (Date.now() > p.expiresAt) {
      return { valid: false, error: 'QR Code has expired. Please refresh the token.' };
    }

    return { valid: true, payload: p };
  } catch (err: any) {
    return { valid: false, error: `Failed to decode QR token: ${err.message}` };
  }
};
