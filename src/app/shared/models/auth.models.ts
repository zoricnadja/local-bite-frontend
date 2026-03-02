export type UserRole = 'SYSTEM_ADMIN' | 'FARM_OWNER' | 'WORKER' | 'CUSTOMER';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  farm_id: string | null;
  created_at: string;
}

export interface Farm {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role?: UserRole;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateFarmRequest {
  name: string;
}

export interface CreateFarmResult {
  farm: Farm;
  token: string;
}

export interface AddWorkerRequest {
  email: string;
  password: string;
}

export interface WorkerOut {
  id: string;
  email: string;
  role: 'WORKER';
  farm_id: string;
}
