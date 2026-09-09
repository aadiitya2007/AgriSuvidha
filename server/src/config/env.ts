import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PREFIX: process.env.API_PREFIX || '/api/v1',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://krishisetu:krishisetu_secret@localhost:5432/krishisetu_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'krishisetu_dev_jwt_secret_key_2026_shi26032',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'krishisetu_dev_refresh_secret_key_2026_shi26032',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  QR_SIGNING_SECRET: process.env.QR_SIGNING_SECRET || 'krishisetu_qr_crypto_signing_secret_9981',
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  SMS_GATEWAY_API_KEY: process.env.SMS_GATEWAY_API_KEY || '',
  IS_PROD: process.env.NODE_ENV === 'production',
};
