// Database Types
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  credits: number;
  stripe_customer_id?: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  display_name_tr: string;
  display_name_en: string;
  type: string;
  description: string;
  description_en: string;
  image_url: string;
  styles: string[];
  styles_en: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImageJob {
  id: string;
  user_id: string;
  category_id: string;
  original_image_url: string;
  style: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  n8n_execution_id?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  processed_images?: ProcessedImage[];
}

export interface ProcessedImage {
  id: string;
  job_id: string;
  image_url: string;
  thumbnail_url?: string;
  file_size: number;
  width: number;
  height: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  plan_name: string;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CreditsUsage {
  id: string;
  user_id: string;
  job_id: string;
  credits_used: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  stripe_payment_intent_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed';
  credits_added: number;
  created_at: string;
}

// API Request/Response Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
  error?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ImageUploadRequest {
  category_id: string;
  style: string;
}

export interface ImageUploadResponse {
  job: ImageJob;
  upload_url: string;
}

export interface UserCreditsResponse {
  success: boolean;
  data: {
    remaining_credits: number;
    total_credits: number;
    used_credits: number;
  };
}

export interface JobStatusResponse {
  success: boolean;
  data: {
    job: ImageJob;
    processed_images: ProcessedImage[];
  };
}

// Frontend specific types
export interface CategoryWithStats extends Category {
  jobCount?: number;
  lastUsed?: string;
}

export interface JobWithImages extends ImageJob {
  category?: Category;
  processed_images: ProcessedImage[];
}

// Stripe types
export interface StripePrice {
  id: string;
  amount: number;
  currency: string;
  credits: number;
  popular?: boolean;
}

export interface CreatePaymentIntentRequest {
  price_id: string;
}

export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
}

export interface SubscriptionCreateRequest {
  price_id: string;
}

export interface SubscriptionCreateResponse {
  subscription: Subscription;
  client_secret?: string;
}

// n8n types
export interface N8NWebhookPayload {
  executionId: string;
  status: 'success' | 'error';
  data?: {
    processed_images?: {
      url: string;
      thumbnail_url?: string;
      width: number;
      height: number;
      file_size: number;
    }[];
  };
  error?: string;
}

export interface N8NProcessingParams {
  category: string;
  style: string;
  imageUrl: string;
  userId: string;
  jobId: string;
}