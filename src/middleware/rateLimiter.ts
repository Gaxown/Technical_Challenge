import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Rate limit by API key if present, otherwise by IP
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) return apiKey;

    return req.ip || res.socket?.remoteAddress || 'unknown';
  },
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.',
    });
  },
  skip: (req) => {
    return req.path === '/health';
  },
});
