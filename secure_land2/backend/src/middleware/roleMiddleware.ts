import { Response } from 'express';
import { ResponseHandler } from '../utils/responseHandler';
import { AuthRequest } from './authMiddleware';

export type UserRole = 'Buyer' | 'Seller' | 'Official';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: Function): void => {
    if (!req.user) {
      ResponseHandler.unauthorized(res, 'Authentication required');
      return;
    }

    const userRole = req.user.role as UserRole;
    
    if (!allowedRoles.includes(userRole)) {
      ResponseHandler.forbidden(res, `Access denied. Required roles: ${allowedRoles.join(', ')}`);
      return;
    }

    next();
  };
};

export const requireOfficial = requireRole(['Official']);
export const requireSeller = requireRole(['Seller', 'Official']);
export const requireBuyer = requireRole(['Buyer', 'Seller', 'Official']);

export default {
  requireRole,
  requireOfficial,
  requireSeller,
  requireBuyer
};
