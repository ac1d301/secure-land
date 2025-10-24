import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData } from '../types';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<any>;
  register: (data: RegisterData) => Promise<any>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<RegisterData>) => Promise<User>;
  refreshUser: () => Promise<User>;
  hasRole: (role: string | string[]) => boolean;
  isOfficial: () => boolean;
  isSeller: () => boolean;
  isBuyer: () => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
          const user = JSON.parse(userStr);
          setAuthState({
            user,
            token,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setAuthState({
            user: null,
            token: null,
            isLoading: false,
            isAuthenticated: false,
          });
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthState({
          user: null,
          token: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await apiService.login(credentials);

      // Store in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setAuthState({
        user: response.user,
        token: response.token,
        isLoading: false,
        isAuthenticated: true,
      });

      toast.success('Login successful!');
      return response;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await apiService.register(data);

      // Store in localStorage
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      setAuthState({
        user: response.user,
        token: response.token,
        isLoading: false,
        isAuthenticated: true,
      });

      toast.success('Registration successful!');
      return response;
    } catch (error: any) {
      setAuthState(prev => ({ ...prev, isLoading: false }));
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      setAuthState({
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
      });

      toast.success('Logged out successfully');
    }
  }, []);

  const updateUser = useCallback(async (data: Partial<RegisterData>) => {
    try {
      const updatedUser = await apiService.updateUser(data);

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
      }));

      toast.success('Profile updated successfully!');
      return updatedUser;
    } catch (error: any) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);
      throw error;
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const user = await apiService.getUser();

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState(prev => ({
        ...prev,
        user,
      }));

      return user;
    } catch (error: any) {
      console.error('Error refreshing user:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  }, [logout]);

  const hasRole = useCallback((role: string | string[]) => {
    if (!authState.user) return false;

    if (Array.isArray(role)) {
      return role.includes(authState.user.role);
    }

    return authState.user.role === role;
  }, [authState.user]);

  const isOfficial = useCallback(() => {
    return hasRole('Official');
  }, [hasRole]);

  const isSeller = useCallback(() => {
    return hasRole(['Seller', 'Official']);
  }, [hasRole]);

  const isBuyer = useCallback(() => {
    return hasRole(['Buyer', 'Seller', 'Official']);
  }, [hasRole]);

  const value: AuthContextValue = {
    ...authState,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    hasRole,
    isOfficial,
    isSeller,
    isBuyer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
