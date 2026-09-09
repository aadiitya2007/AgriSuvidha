import { ensurePostgresRunning } from './dbManager';
import { execSync } from 'child_process';
import { logger } from '../utils/logger';

async function main() {
  await ensurePostgresRunning();
  logger.info('Pushing Prisma schema to PostgreSQL database...');
  try {
    execSync('npx prisma db push --skip-generate', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.local/node/bin:${process.env.PATH}`,
        DATABASE_URL: 'postgresql://krishisetu:krishisetu_secret@localhost:5432/krishisetu_db?schema=public',
      },
    });
    logger.info('Database schema pushed successfully to PostgreSQL!');
  } catch (err: any) {
    logger.error('Failed to push database schema:', err);
    process.exit(1);
  }
}

main().catch(console.error);
