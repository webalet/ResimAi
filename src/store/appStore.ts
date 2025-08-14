import { create } from 'zustand';
import { Category, ImageJob } from '../../shared/types';
import { categoriesAPI, imagesAPI, subscriptionsAPI } from '../lib/api';

interface AppState {
  // Categories
  categories: Category[];
  selectedCategory: Category | null;
  selectedStyle: string | null;
  
  // Image jobs
  imageJobs: ImageJob[];
  currentJob: ImageJob | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // User credits
  userCredits: {
    remaining: number;
    total: number;
    used: number;
  } | null;
  
  // Actions
  loadCategories: () => Promise<void>;
  selectCategory: (category: Category) => void;
  selectStyle: (style: string) => void;
  
  loadUserJobs: () => Promise<void>;
  addImageJob: (job: ImageJob) => void;
  updateImageJob: (jobId: string, updates: Partial<ImageJob>) => void;
  
  loadUserCredits: () => Promise<void>;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set, _get) => ({
  // Initial state
  categories: [],
  selectedCategory: null,
  selectedStyle: null,
  
  imageJobs: [],
  currentJob: null,
  
  isLoading: false,
  error: null,
  
  userCredits: null,
  
  // Actions
  loadCategories: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await categoriesAPI.getAll();
      
      if (response.success) {
        set({ 
          categories: response.data,
          isLoading: false 
        });
      } else {
        throw new Error(response.message || 'Kategoriler yüklenemedi');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'Kategoriler yüklenirken hata oluştu',
        isLoading: false
      });
    }
  },
  
  selectCategory: (category: Category) => {
    set({ 
      selectedCategory: category,
      selectedStyle: null // Reset style when category changes
    });
  },
  
  selectStyle: (style: string) => {
    set({ selectedStyle: style });
  },
  
  loadUserJobs: async () => {
    try {
      set({ isLoading: true, error: null });
      
      const response = await imagesAPI.getUserJobs(1, 50);
      
      if (response.success) {
        set({ 
          imageJobs: response.data.jobs || [],
          isLoading: false 
        });
      } else {
        throw new Error(response.message || 'İşler yüklenemedi');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || error.message || 'İşler yüklenirken hata oluştu',
        isLoading: false
      });
    }
  },
  
  addImageJob: (job: ImageJob) => {
    set((state) => ({
      imageJobs: [job, ...state.imageJobs],
      currentJob: job
    }));
  },
  
  updateImageJob: (jobId: string, updates: Partial<ImageJob>) => {
    set((state) => ({
      imageJobs: state.imageJobs.map(job =>
        job.id === jobId
          ? {
              ...job,
              ...updates,
              processed_images: updates.processed_images ?? job.processed_images ?? [],
              updated_at: new Date().toISOString()
            } as ImageJob
          : job
      ),
      currentJob: state.currentJob?.id === jobId
        ? {
            ...state.currentJob,
            ...updates,
            processed_images: updates.processed_images ?? state.currentJob.processed_images ?? [],
            updated_at: new Date().toISOString()
          } as ImageJob
        : state.currentJob
    }));
  },
  
  loadUserCredits: async () => {
    try {
      const response = await subscriptionsAPI.getCredits();
      
      if (response.success) {
        set({ 
          userCredits: {
            remaining: response.data.remaining_credits,
            total: response.data.total_credits,
            used: response.data.used_credits
          }
        });
      }
    } catch (error: any) {
      console.error('Credits load error:', error);
      // Don't set error for credits as it's not critical
    }
  },
  
  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },
  
  setError: (error: string | null) => {
    set({ error });
  },
  
  clearError: () => {
    set({ error: null });
  },
}));