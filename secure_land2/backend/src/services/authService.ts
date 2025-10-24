import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { logger } from '../utils/logger';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'Buyer' | 'Seller' | 'Official';
}

export interface AuthResult {
  user: any;
  token: string;
}

export class AuthService {
  private static generateToken(userId: string, email: string, role: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign(
      { id: userId, email, role },
      jwtSecret,
      { expiresIn: '24h' }
    );
  }

  static async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: data.email });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const user = new User({
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'Buyer'
      });

      await user.save();

      // Generate token
      const token = this.generateToken(user._id, user.email, user.role);

      // Return user without password
      const { password, ...userWithoutPassword } = user.toObject();

      logger.info(`New user registered: ${user.email} with role: ${user.role}`);

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  static async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      const { email, password } = credentials;

      // Find user by email
      const user = await User.findOne({ email }).select('+password');
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken(user._id, user.email, user.role);

      // Return user without password
      const { password: _, ...userWithoutPassword } = user.toObject();

      logger.info(`User logged in: ${user.email}`);

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  static async getUserById(userId: string): Promise<any | null> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        return null;
      }

      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  static async updateUser(userId: string, updateData: Partial<RegisterData>): Promise<any | null> {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: updateData },
        { new: true, runValidators: true }
      );

      if (!user) {
        return null;
      }

      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    } catch (error) {
      logger.error('Update user error:', error);
      throw error;
    }
  }
}

export default AuthService;
