export interface User {
  id: string;
  name: string;
  email: string;
  credits: number;
  is_admin: boolean;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

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
  user: User;
  token: string;
}

export interface LoginResponse extends AuthResponse {}

export interface RegisterResponse extends AuthResponse {}