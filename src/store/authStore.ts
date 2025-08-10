import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../../shared/types';
import { authAPI } from '../lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.login({ email, password });
          
          if (response.success && response.user && response.token) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            // Store token in localStorage for API requests
            localStorage.setItem('auth_token', response.token);
          } else {
            throw new Error(response.message || 'Giriş başarısız');
          }
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Giriş sırasında hata oluştu'
          });
          throw error;
        }
      },

      register: async (email: string, password: string, name: string) => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await authAPI.register({ email, password, name });
          
          if (response.success && response.user && response.token) {
            set({
              user: response.user,
              token: response.token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            // Store token in localStorage for API requests
            localStorage.setItem('auth_token', response.token);
          } else {
            throw new Error(response.message || 'Kayıt başarısız');
          }
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.response?.data?.message || error.message || 'Kayıt sırasında hata oluştu'
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          
          // Clear localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      },

      getCurrentUser: async () => {
        try {
          const token = localStorage.getItem('auth_token');
          if (!token) {
            set({ isAuthenticated: false, user: null, token: null });
            return;
          }

          set({ isLoading: true });
          
          const response = await authAPI.getCurrentUser();
          
          if (response.success && response.user) {
            set({
              user: response.user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
          } else {
            throw new Error('Kullanıcı bilgileri alınamadı');
          }
        } catch (error: any) {
          console.error('Get current user error:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          
          // Clear invalid token
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);