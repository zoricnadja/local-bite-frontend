export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  created_at: string;
}

export type Role = 'SYSTEM_ADMIN' | 'FARM_OWNER' | 'WORKER' | 'CUSTOMER';