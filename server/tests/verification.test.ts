import { describe, it, expect } from 'vitest';
import { generateNumericOtp, hashValue, signQrToken, verifyAndDecodeQrToken } from '../src/utils/crypto';

describe('Verification & Cryptography Tests', () => {
  it('should generate valid 6-digit numeric OTPs', () => {
    const otp = generateNumericOtp(6);
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  it('should sign and verify valid QR tokens with HMAC SHA-256', () => {
    const payload = {
      bookingId: 'book-123',
      farmerId: 'farmer-456',
      centreId: 'centre-789',
      nonce: 'nonce-abc',
      expiresAt: Date.now() + 3600 * 1000,
    };

    const signedToken = signQrToken(payload);
    expect(typeof signedToken).toBe('string');
    expect(signedToken.length).toBeGreaterThan(20);

    const verified = verifyAndDecodeQrToken(signedToken);
    expect(verified.valid).toBe(true);
    expect(verified.payload?.bookingId).toBe('book-123');
    expect(verified.payload?.farmerId).toBe('farmer-456');
    expect(verified.payload?.centreId).toBe('centre-789');
  });

  it('should reject tampered or forged QR tokens', () => {
    const payload = {
      bookingId: 'book-123',
      farmerId: 'farmer-456',
      centreId: 'centre-789',
      nonce: 'nonce-abc',
      expiresAt: Date.now() + 3600 * 1000,
    };

    const signedToken = signQrToken(payload);
    // Tamper with payload
    const decodedRaw = Buffer.from(signedToken, 'base64url').toString('utf8');
    const parsed = JSON.parse(decodedRaw);
    parsed.p.farmerId = 'attacker-999'; // Tamper
    const tamperedToken = Buffer.from(JSON.stringify(parsed)).toString('base64url');

    const result = verifyAndDecodeQrToken(tamperedToken);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid cryptographic signature');
  });

  it('should reject expired QR tokens', () => {
    const expiredPayload = {
      bookingId: 'book-123',
      farmerId: 'farmer-456',
      centreId: 'centre-789',
      nonce: 'nonce-abc',
      expiresAt: Date.now() - 1000, // Expired 1 second ago
    };

    const signedToken = signQrToken(expiredPayload);
    const result = verifyAndDecodeQrToken(signedToken);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('expired');
  });
});
