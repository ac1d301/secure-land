import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    ResponseHandler.unauthorized(res, 'Access token required');
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    logger.error('JWT_SECRET is not defined');
    ResponseHandler.error(res, 'Server configuration error');
    return;
  }

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      logger.warn('Invalid token:', err.message);
      ResponseHandler.unauthorized(res, 'Invalid or expired token');
      return;
    }

    req.user = user;
    next();
  });
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = undefined;
    next();
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    req.user = undefined;
    next();
    return;
  }

  jwt.verify(token, jwtSecret, (err: any, user: any) => {
    if (err) {
      req.user = undefined;
    } else {
      req.user = user;
    }
    next();
  });
};

export default authenticateToken;
