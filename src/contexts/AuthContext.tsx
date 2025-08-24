import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '../types/auth';
import { authService } from '../services/authService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastLoginAttemptRef = useRef<number>(0);
  const lastRegisterAttemptRef = useRef<number>(0);
  const RATE_LIMIT_MS = 2000; // 2 seconds between auth requests
  const { t } = useTranslation();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('adminToken');
      
      if (adminToken) {
        // Check admin token validity
        try {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://64.226.75.76';
          const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
            headers: {
              'Authorization': `Bearer ${adminToken}`
            }
          });
          
          if (response.ok) {
            // Create admin user object
            setUser({
              id: 'admin',
              name: 'Admin',
              email: 'admin@resim.ai',
              credits: 0,
              is_admin: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            return;
          } else {
            localStorage.removeItem('adminToken');
          }
        } catch (error) {
          localStorage.removeItem('adminToken');
        }
      }
      
      if (token) {
        try {
          const userData = await authService.getCurrentUser();
          setUser(userData);
        } catch (error: any) {
          // If 403 error, user is banned - logout immediately
          if (error.response?.status === 403) {
            localStorage.removeItem('token');
            localStorage.removeItem('adminToken');
            setUser(null);
            toast.error(t('auth.errors.accountBanned'));
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
          // Don't throw error, just clean up and continue
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastLogin = now - lastLoginAttemptRef.current;
    
    if (timeSinceLastLogin < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastLogin) / 1000);
      const errorMessage = t('auth.errors.waitSeconds', { seconds: remainingTime });
      throw new Error(errorMessage);
    }

    lastLoginAttemptRef.current = now;

    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      toast.success(t('auth.success.login'));
    } catch (error: any) {
      // Don't show toast messages here - let the calling component handle it
      // Just throw the error with enhanced information
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        error.retryAfter = retryAfter;
        error.userMessage = t('auth.errors.tooManyAttempts');
      } else if (error.response?.status === 401) {
        error.userMessage = t('auth.errors.invalidCredentials');
      } else if (error.response?.status === 403) {
        // Check if it's a banned account error
        if (error.response?.data?.message?.includes('yasaklan') || error.response?.data?.message?.includes('banned')) {
          error.userMessage = t('auth.errors.bannedCannotLogin');
        } else {
          error.userMessage = t('auth.errors.invalidCredentials');
        }
      } else if (error.response?.status === 422) {
        error.userMessage = t('auth.errors.invalidCredentials');
      } else if (error.response?.status >= 500) {
        error.userMessage = t('common.error');
      } else {
        error.userMessage = error.message || t('auth.errors.loginFailed');
      }
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    // Rate limiting check
    const now = Date.now();
    const timeSinceLastRegister = now - lastRegisterAttemptRef.current;
    
    if (timeSinceLastRegister < RATE_LIMIT_MS) {
      const remainingTime = Math.ceil((RATE_LIMIT_MS - timeSinceLastRegister) / 1000);
      const errorMessage = t('auth.errors.waitSeconds', { seconds: remainingTime });
      throw new Error(errorMessage);
    }

    lastRegisterAttemptRef.current = now;

    try {
      const response = await authService.register(name, email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
      toast.success(t('auth.success.register'));
    } catch (error: any) {
      // Don't show toast messages here - let the calling component handle it
      // Just throw the error with enhanced information
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'];
        error.retryAfter = retryAfter;
        error.userMessage = t('auth.errors.tooManyAttempts');
      } else if (error.response?.status === 409) {
        error.userMessage = 'Bu e-posta adresi zaten kullanılıyor.';
      } else if (error.response?.status === 422) {
        error.userMessage = t('auth.errors.fillAllFields');
      } else if (error.response?.status >= 500) {
        error.userMessage = t('common.error');
      } else {
        error.userMessage = error.message || t('auth.errors.fillAllFields');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      setUser(null);
      toast.success(t('auth.success.logout'));
    } catch (error: any) {
      toast.error(t('auth.errors.serverError'));
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error: any) {
      // If 403 error, user is banned - logout immediately
      if (error.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('adminToken');
        setUser(null);
        toast.error(t('auth.errors.accountBanned'));
      }
      console.error('User refresh failed:', error);
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};