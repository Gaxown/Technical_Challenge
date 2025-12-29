import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/logger';

export interface RequestWithId extends Request {
  id?: string;
}

export const requestLogger = (req: RequestWithId, _res: Response, next: NextFunction) => {
  req.id = generateRequestId();
  next();
};
