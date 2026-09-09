import net from 'net';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

let embeddedInstance: any = null;

export const isPortOpen = (port: number, host = '127.0.0.1'): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
};

export const ensurePostgresRunning = async (): Promise<void> => {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl && !dbUrl.includes('localhost') && !dbUrl.includes('127.0.0.1')) {
    logger.info('Remote cloud PostgreSQL DATABASE_URL detected. Skipping local postgres check.');
    return;
  }

  const port = 5432;
  const alreadyRunning = await isPortOpen(port);

  if (alreadyRunning) {
    logger.info(`PostgreSQL is already running on port ${port}. Using active instance.`);
    return;
  }

  try {
    let EmbeddedPostgres: any;
    try {
      const epModule = await (new Function('return import("embedded-postgres")')() as Promise<any>);
      EmbeddedPostgres = epModule.default;
    } catch {
      // @ts-ignore
      const epModule = await import('embedded-postgres');
      EmbeddedPostgres = epModule.default;
    }

    const dbDir = path.resolve(__dirname, '../../.pgdata');
    const isNew = !fs.existsSync(dbDir);

    embeddedInstance = new EmbeddedPostgres({
      databaseDir: dbDir,
      port,
      user: 'krishisetu',
      password: 'krishisetu_secret',
      persistent: true,
    });

    if (isNew) {
      logger.info('Initializing new PostgreSQL database cluster...');
      await embeddedInstance.initialise();
    }

    await embeddedInstance.start();
    logger.info(`Native PostgreSQL successfully running on port ${port}.`);

    try {
      await embeddedInstance.createDatabase('krishisetu_db');
      logger.info('Database "krishisetu_db" confirmed/created.');
    } catch (e: any) {
      // Database might already exist
    }
  } catch (err: any) {
    logger.warn(`Could not start embedded PostgreSQL: ${err.message}. Ensure Docker or local Postgres is running.`);
  }
};

export const stopPostgresIfManaged = async (): Promise<void> => {
  if (embeddedInstance) {
    logger.info('Shutting down managed PostgreSQL instance...');
    try {
      await embeddedInstance.stop();
      logger.info('PostgreSQL shut down cleanly.');
    } catch (err: any) {
      logger.error('Error stopping PostgreSQL:', err);
    }
  }
};

// Graceful cleanup on process exit
process.on('SIGINT', async () => {
  await stopPostgresIfManaged();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await stopPostgresIfManaged();
  process.exit(0);
});
