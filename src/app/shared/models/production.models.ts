export type BatchStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProcessStep {
  id: string;
  step_order: number;
  name: string;
  description: string | null;
  duration_hours: number | null;
  temperature: number | null;
}

export interface BatchRawMaterial {
  id: string;
  raw_material_id: string;
  name: string;
  material_type: string;
  quantity_used: number;
  unit: string;
  origin: string | null;
  supplier: string | null;
}

export interface ProductionBatch {
  id: string;
  farm_id: string;
  name: string;
  process_type: string;
  start_date: string | null;
  end_date: string | null;
  status: BatchStatus;
  notes: string | null;
  steps: ProcessStep[];
  raw_materials: BatchRawMaterial[];
  created_at: string;
  updated_at: string;
}

export interface CreateBatchRequest {
  name: string;
  process_type: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  raw_materials?: { raw_material_id: string; quantity_used: number; unit: string }[];
}

export interface UpdateBatchRequest {
  name?: string;
  process_type?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  status?: BatchStatus;
}

export interface CreateStepRequest {
  step_order: number;
  name: string;
  description?: string;
  duration_hours?: number;
  temperature?: number;
}

export interface UpdateStepRequest {
  step_order?: number;
  name?: string;
  description?: string;
  duration_hours?: number;
  temperature?: number;
}

export interface AddRawMaterialRequest {
  raw_material_id: string;
  quantity_used: number;
  unit: string;
}

export interface BatchListQuery {
  page?: number;
  limit?: number;
  status?: BatchStatus;
  process_type?: string;
  search?: string;
}

export const BATCH_STATUS_TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  PLANNED:     ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED',   'CANCELLED'],
  COMPLETED:   [],
  CANCELLED:   [],
};
