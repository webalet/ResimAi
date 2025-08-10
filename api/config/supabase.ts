import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client with service role key for backend operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client with anon key for frontend-like operations
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase anon key');
}

export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Database types (you can generate these with Supabase CLI)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          password_hash: string;
          credits: number;
          stripe_customer_id: string | null;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          password_hash: string;
          credits?: number;
          stripe_customer_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          password_hash?: string;
          credits?: number;
          stripe_customer_id?: string | null;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: string;
          description: string | null;
          image_url: string | null;
          styles: string[];
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: string;
          description?: string | null;
          image_url?: string | null;
          styles?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string;
          description?: string | null;
          image_url?: string | null;
          styles?: string[];
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      image_jobs: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          category_type: string;
          style: string;
          original_image_url: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          category_type: string;
          style: string;
          original_image_url: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string;
          category_type?: string;
          style?: string;
          original_image_url?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      processed_images: {
        Row: {
          id: string;
          job_id: string;
          image_url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          image_url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          image_url?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan_name: string;
          status: 'active' | 'canceled' | 'past_due' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          canceled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string;
          plan_name: string;
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid';
          current_period_start: string;
          current_period_end: string;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string;
          plan_name?: string;
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid';
          current_period_start?: string;
          current_period_end?: string;
          canceled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credits_usage: {
        Row: {
          id: string;
          user_id: string;
          job_id: string | null;
          credits_used: number;
          operation_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_id?: string | null;
          credits_used: number;
          operation_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_id?: string | null;
          credits_used?: number;
          operation_type?: string;
          created_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          stripe_payment_intent_id: string;
          amount: number;
          currency: string;
          status: 'pending' | 'completed' | 'failed';
          plan_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_payment_intent_id: string;
          amount: number;
          currency: string;
          status?: 'pending' | 'completed' | 'failed';
          plan_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_payment_intent_id?: string;
          amount?: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed';
          plan_name?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}