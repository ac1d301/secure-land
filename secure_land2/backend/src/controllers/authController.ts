import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../utils/logger';
import AuthService, { RegisterData, LoginCredentials } from '../services/authService';
import AuditLog from '../models/AuditLog';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        ResponseHandler.validationError(res, 'Validation failed', errors.array());
        return;
      }

      const { email, password, firstName, lastName, role } = req.body;
      
      const registerData: RegisterData = {
        email,
        password,
        firstName,
        lastName,
        role
      };

      const result = await AuthService.register(registerData);

      // Log registration
      await AuditLog.create({
        userId: result.user._id,
        action: 'REGISTER',
        resourceType: 'AUTH',
        details: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      ResponseHandler.success(res, result, 'User registered successfully', 201);
    } catch (error: any) {
      logger.error('Registration error:', error);
      ResponseHandler.error(res, error.message, 400);
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        ResponseHandler.validationError(res, 'Validation failed', errors.array());
        return;
      }

      const { email, password } = req.body;
      
      const credentials: LoginCredentials = {
        email,
        password
      };

      const result = await AuthService.login(credentials);

      // Log login
      await AuditLog.create({
        userId: result.user._id,
        action: 'LOGIN',
        resourceType: 'AUTH',
        details: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      ResponseHandler.success(res, result, 'Login successful');
    } catch (error: any) {
      logger.error('Login error:', error);
      ResponseHandler.error(res, error.message, 401);
    }
  }

  static async getUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      
      const user = await AuthService.getUserById(userId);
      
      if (!user) {
        ResponseHandler.notFound(res, 'User not found');
        return;
      }

      ResponseHandler.success(res, user, 'User retrieved successfully');
    } catch (error: any) {
      logger.error('Get user error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;
      const updateData = req.body;

      // Remove sensitive fields
      delete updateData.password;
      delete updateData.role;
      delete updateData._id;

      const user = await AuthService.updateUser(userId, updateData);
      
      if (!user) {
        ResponseHandler.notFound(res, 'User not found');
        return;
      }

      ResponseHandler.success(res, user, 'User updated successfully');
    } catch (error: any) {
      logger.error('Update user error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user.id;

      // Log logout
      await AuditLog.create({
        userId,
        action: 'LOGOUT',
        resourceType: 'AUTH',
        details: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      ResponseHandler.success(res, null, 'Logout successful');
    } catch (error: any) {
      logger.error('Logout error:', error);
      ResponseHandler.error(res, error.message, 500);
    }
  }
}

export default AuthController;
