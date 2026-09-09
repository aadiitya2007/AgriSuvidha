import { Request, Response, NextFunction } from 'express';

const idempotencyCache = new Map<string, { statusCode: number; body: any; timestamp: number }>();

// Evict records older than 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of idempotencyCache.entries()) {
    if (now - val.timestamp > 10 * 60 * 1000) {
      idempotencyCache.delete(key);
    }
  }
}, 60 * 1000);

export const checkIdempotency = (req: Request, res: Response, next: NextFunction) => {
  const idempotencyKey = req.header('Idempotency-Key');
  if (!idempotencyKey) {
    return next();
  }

  const cached = idempotencyCache.get(idempotencyKey);
  if (cached) {
    return res.status(cached.statusCode).json({
      ...cached.body,
      _idempotentReplay: true,
    });
  }

  // Intercept response to store in cache
  const originalJson = res.json.bind(res);
  res.json = ((body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyCache.set(idempotencyKey, {
        statusCode: res.statusCode,
        body,
        timestamp: Date.now(),
      });
    }
    return originalJson(body);
  }) as any;

  next();
};
