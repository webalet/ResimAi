import { useState, useCallback, useRef } from 'react';
import { AxiosResponse, AxiosError } from 'axios';
import { apiClient } from '../services/apiClient';

interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

interface UseApiWithRetryOptions {
  cacheKey?: string;
  cacheDuration?: number; // in milliseconds
  retryConfig?: RetryConfig;
  rateLimitDelay?: number; // minimum delay between requests
}

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retryCount: number;
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private requestTimestamps = new Map<string, number>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.expiresIn) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, expiresIn: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  canMakeRequest(key: string, minDelay: number): boolean {
    const lastRequest = this.requestTimestamps.get(key);
    if (!lastRequest) return true;

    return Date.now() - lastRequest >= minDelay;
  }

  recordRequest(key: string): void {
    this.requestTimestamps.set(key, Date.now());
  }

  clear(): void {
    this.cache.clear();
    this.requestTimestamps.clear();
  }
}

const globalCache = new ApiCache();

const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const { baseDelay = 1000, maxDelay = 30000, backoffFactor = 2 } = config;
  const delay = baseDelay * Math.pow(backoffFactor, attempt);
  return Math.min(delay, maxDelay);
};

export function useApiWithRetry<T = any>(options: UseApiWithRetryOptions = {}) {
  const {
    cacheKey,
    cacheDuration = 5 * 60 * 1000, // 5 minutes default
    retryConfig = {},
    rateLimitDelay = 1000 // 1 second default
  } = options;

  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const executeRequest = useCallback(async (
    requestFn: () => Promise<AxiosResponse<T>>,
    attempt: number = 0
  ): Promise<T> => {
    const { maxRetries = 3 } = retryConfig;

    try {
      // Check rate limiting
      if (cacheKey && !globalCache.canMakeRequest(cacheKey, rateLimitDelay)) {
        const waitTime = rateLimitDelay - (Date.now() - (globalCache as any).requestTimestamps.get(cacheKey) || 0);
        if (waitTime > 0) {
          await sleep(waitTime);
        }
      }

      // Record request timestamp
      if (cacheKey) {
        globalCache.recordRequest(cacheKey);
      }

      const response = await requestFn();
      
      // Cache successful response
      if (cacheKey && response.data) {
        globalCache.set(cacheKey, response.data, cacheDuration);
      }

      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Handle 429 (Too Many Requests) with exponential backoff
      if (axiosError.response?.status === 429 && attempt < maxRetries) {
        const delay = calculateDelay(attempt, retryConfig);
        console.log(`Rate limited. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        await sleep(delay);
        return executeRequest(requestFn, attempt + 1);
      }

      // Handle other retryable errors (5xx, network errors, insufficient resources)
      if (attempt < maxRetries && (
        axiosError.response?.status >= 500 ||
        axiosError.code === 'ECONNABORTED' ||
        axiosError.code === 'ERR_INSUFFICIENT_RESOURCES' ||
        !axiosError.response
      )) {
        const delay = calculateDelay(attempt, retryConfig);
        console.log(`Request failed. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        await sleep(delay);
        return executeRequest(requestFn, attempt + 1);
      }

      throw error;
    }
  }, [cacheKey, cacheDuration, retryConfig.maxRetries, retryConfig.baseDelay, retryConfig.maxDelay, retryConfig.backoffFactor, rateLimitDelay]);

  const request = useCallback(async (
    requestFn: () => Promise<AxiosResponse<T>>
  ): Promise<T | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Check cache first
    if (cacheKey) {
      const cachedData = globalCache.get<T>(cacheKey);
      if (cachedData) {
        setState(prev => ({ ...prev, data: cachedData, loading: false, error: null }));
        return cachedData;
      }
    }

    setState(prev => ({ ...prev, loading: true, error: null, retryCount: 0 }));

    try {
      const data = await executeRequest(requestFn);
      setState(prev => ({ ...prev, data, loading: false, error: null }));
      return data;
    } catch (error) {
      const axiosError = error as AxiosError;
      let errorMessage = 'Bir hata oluştu';

      if (axiosError.response?.status === 429) {
        errorMessage = 'Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.';
      } else if (axiosError.response?.status >= 500) {
        errorMessage = 'Sunucu hatası. Lütfen daha sonra tekrar deneyin.';
      } else if (axiosError.code === 'ECONNABORTED') {
        errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
      } else if (axiosError.code === 'ERR_INSUFFICIENT_RESOURCES') {
        errorMessage = 'Sistem kaynakları yetersiz. Lütfen bir süre bekleyip tekrar deneyin.';
      } else if (!axiosError.response) {
        errorMessage = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
      } else if (axiosError.response?.data && typeof axiosError.response.data === 'object' && 'message' in axiosError.response.data) {
        errorMessage = (axiosError.response.data as { message: string }).message;
      }

      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      return null;
    }
  }, [executeRequest, cacheKey]);

  const clearCache = useCallback(() => {
    if (cacheKey) {
      globalCache.set(cacheKey, null, 0);
    }
  }, [cacheKey]);

  const retry = useCallback(async (requestFn: () => Promise<AxiosResponse<T>>) => {
    clearCache();
    return request(requestFn);
  }, [request, clearCache]);

  return {
    ...state,
    request,
    retry,
    clearCache
  };
}

export { globalCache };