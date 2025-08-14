import { User, AuthResponse } from '../types/auth';
import { apiClient } from './apiClient';

class AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{success: boolean, data: AuthResponse}>('/auth/login', {
      email,
      password,
    });
    return response.data.data;
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const response = await apiClient.post<{success: boolean, data: AuthResponse}>('/auth/register', {
      name,
      email,
      password,
    });
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<{success: boolean, data: {user: User}}>('/auth/me');
    return response.data.data.user;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await apiClient.post<{success: boolean, data: AuthResponse}>('/auth/refresh');
    return response.data.data;
  }

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  }

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email });
  }

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  removeToken(): void {
    localStorage.removeItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();