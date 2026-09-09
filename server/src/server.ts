import app from './app';
import { ENV } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './prisma/client';
import { ensurePostgresRunning, stopPostgresIfManaged } from './prisma/dbManager';

async function startServer() {
  try {
    // 1. Ensure PostgreSQL is active (or launch embedded instance if needed)
    await ensurePostgresRunning();

    // 2. Connect Prisma ORM
    await connectDatabase();

    // 3. Start HTTP server
    const server = app.listen(ENV.PORT, () => {
      logger.info(`=======================================================`);
      logger.info(` KrishiSetu API Server running on port ${ENV.PORT}`);
      logger.info(` Health check: http://localhost:${ENV.PORT}/health`);
      logger.info(` Readiness:    http://localhost:${ENV.PORT}/ready`);
      logger.info(` API Docs:     http://localhost:${ENV.PORT}/api/docs`);
      logger.info(` API Root:     http://localhost:${ENV.PORT}${ENV.API_PREFIX}`);
      logger.info(`=======================================================`);
    });

    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        logger.info('HTTP server closed.');
        await stopPostgresIfManaged();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (err: any) {
    logger.error('Fatal startup error:', err);
    process.exit(1);
  }
}

startServer();
