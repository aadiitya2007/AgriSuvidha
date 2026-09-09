import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected successfully to PostgreSQL database via Prisma.');
  } catch (err: any) {
    logger.error('Failed to connect to PostgreSQL database via Prisma:', err);
    throw err;
  }
};
