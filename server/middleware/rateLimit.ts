import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const stores = new Map<string, Map<string, RateLimitStore>>();

/**
 * In-memory sliding window rate limiter
 * @param windowMs Time window in milliseconds
 * @param max Max requests allowed in the time window
 * @param keyPrefix Prefix for the limiter bucket
 */
export function rateLimiter(windowMs: number, max: number, keyPrefix = 'global') {
  if (!stores.has(keyPrefix)) {
    stores.set(keyPrefix, new Map());
  }
  const store = stores.get(keyPrefix)!;

  // Cleanup expired entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key);
      }
    }
  }, windowMs * 2);

  return (req: Request, res: Response, next: NextFunction) => {
    // Determine client identifier: IP address or User ID if authenticated
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const authHeader = req.headers.authorization;
    const key = authHeader ? `${ip}_${authHeader.substring(0, 20)}` : ip;

    const now = Date.now();
    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      store.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSec = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSec);

    if (record.count > max) {
      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again later.',
        retryAfterSeconds: resetSec
      });
    }

    next();
  };
}

// Preset rate limiters
export const standardApiLimiter = rateLimiter(60 * 1000, 120, 'api_standard'); // 120 req/min
export const sensitiveActionLimiter = rateLimiter(60 * 1000, 20, 'api_sensitive'); // 20 req/min for submissions/payments
export const reportsLimiter = rateLimiter(60 * 1000, 10, 'api_reports'); // 10 req/min
