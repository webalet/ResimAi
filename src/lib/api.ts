import axios from 'axios';
import { 
  AuthResponse, 
  RegisterRequest, 
  LoginRequest,
  ImageUploadResponse,
  JobStatusResponse,
  UserCreditsResponse,
  SubscriptionCreateRequest,
  SubscriptionCreateResponse
} from '../../shared/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('user_data');
  },

  getCurrentUser: async (): Promise<AuthResponse> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    const response = await api.get('/categories');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  getStyles: async (categoryType: string) => {
    const response = await api.get(`/categories/${categoryType}/styles`);
    return response.data;
  },
};

// Images API
export const imagesAPI = {
  upload: async (formData: FormData): Promise<ImageUploadResponse> => {
    const response = await api.post('/images/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getJobStatus: async (jobId: string): Promise<JobStatusResponse> => {
    const response = await api.get(`/images/job/${jobId}/status`);
    return response.data;
  },

  getUserJobs: async (page = 1, limit = 20) => {
    const response = await api.get(`/images/jobs?page=${page}&limit=${limit}`);
    return response.data;
  },

  deleteJob: async (jobId: string) => {
    const response = await api.delete(`/images/job/${jobId}`);
    return response.data;
  },
};

// Subscriptions API
export const subscriptionsAPI = {
  getCurrent: async () => {
    const response = await api.get('/subscriptions/current');
    return response.data;
  },

  getCredits: async (): Promise<UserCreditsResponse> => {
    const response = await api.get('/subscriptions/credits');
    return response.data;
  },

  getPlans: async () => {
    const response = await api.get('/subscriptions/plans');
    return response.data;
  },

  create: async (data: SubscriptionCreateRequest): Promise<SubscriptionCreateResponse> => {
    const response = await api.post('/subscriptions/create', data);
    return response.data;
  },

  cancel: async () => {
    const response = await api.post('/subscriptions/cancel');
    return response.data;
  },

  getHistory: async () => {
    const response = await api.get('/subscriptions/history');
    return response.data;
  },
};

export default api;