import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { ENV } from './config/env';
import apiRouter from './routes';
import docsRouter from './routes/docs.routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { prisma } from './prisma/client';

const app = express();

// Security and utility middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline styles & scripts for demo
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: '*',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoints
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'KrishiSetu API',
    version: '1.0.0',
  });
});

app.get('/ready', async (req: Request, res: Response) => {
  try {
    // Database probe
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'READY',
      database: 'CONNECTED',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'NOT_READY',
      database: 'DISCONNECTED',
      error: err.message,
    });
  }
});

// API Documentation
app.use('/api/docs', docsRouter);

// Mount API v1 Routes
app.use(ENV.API_PREFIX, apiRouter);

// Serve static frontend in production if client build exists
const clientDistPath = path.resolve(__dirname, '../public');
const clientBuildPath = path.resolve(__dirname, '../../client/dist');
const staticPath = fs.existsSync(clientDistPath) ? clientDistPath : fs.existsSync(clientBuildPath) ? clientBuildPath : null;

if (staticPath) {
  app.use(express.static(staticPath));
  app.get('*', (req: Request, res: Response, next) => {
    if (req.path.startsWith('/api') || req.path === '/health' || req.path === '/ready') {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

export default app;
