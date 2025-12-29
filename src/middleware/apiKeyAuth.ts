import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface RequestWithApiKey extends Request {
  apiKey?: string;
}

export const apiKeyAuth = (req: RequestWithApiKey, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'] as string;

  if (!apiKey) {
    logger.warn('Missing API key', { path: req.path, ip: req.ip });
    res.status(401).json({ error: 'API key is required', code: 'MISSING_API_KEY' });
    return;
  }

  if (!config.apiKeys.includes(apiKey)) {
    logger.warn('Invalid API key', { path: req.path, ip: req.ip });
    res.status(403).json({ error: 'Invalid API key', code: 'INVALID_API_KEY' });
    return;
  }

  req.apiKey = apiKey;
  next();
};
