export interface User {
  id: string;
  email: string;
  role: 'SystemAdmin' | 'FarmOwner' | 'Worker' | 'Customer';
  farm_id: string | null;

  // Required profile
  first_name: string;
  last_name:  string;
  address:    string;

  // Optional profile
  phone:         string | null;
  photo_url:     string | null;
  date_of_birth: string | null; // ISO date string e.g. "1990-05-20"

  created_at: string;
  updated_at: string;
}

export interface Farm {
  id:       string;
  name:     string;
  owner_id: string;

  // Required
  address:   string;
  photo_url: string;

  // Optional
  phone:       string | null;
  description: string | null;
  website:     string | null;

  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email:    string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user:  User;
}

export interface RegisterRequest {
  email:    string;
  password: string;
  role?:    string;

  // Required profile
  first_name: string;
  last_name:  string;
  address:    string;

  // Optional profile
  phone?:         string;
  photo_url?:     string;
  date_of_birth?: string;
}

export interface UpdateUserRequest {
  email?:         string;
  password?:      string;
  first_name?:    string;
  last_name?:     string;
  address?:       string;
  phone?:         string;
  photo_url?:     string;
  date_of_birth?: string;
}

export interface AddWorkerRequest {
  email:    string;
  password: string;
}

export interface WorkerOut {
  id:      string;
  email:   string;
  role:    string;
  farm_id: string;
}

export interface UpdateFarmRequest {
  name?:        string;
  address?:     string;
  photo_url?:   string;
  phone?:       string;
  description?: string;
  website?:     string;
}

export interface CreateFarmRequest {
  name:       string;
  address:    string;
  photo_url:  string;
  phone?:     string;
  description?: string;
  website?:   string;
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
  role: string;
  farm_id: string;
}
