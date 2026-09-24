export interface ProductionOutput { id?: string; name: string; product_type: string; quantity: number; unit: string; price: number; description?: string; expiry_date?: string; planned?: ProductionOutput; }
export type BatchStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ProcessStep {
  id: string;
  step_order: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  name: string;
  description: string | null;
  variables: StepVariable[];
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
  outputs: ProductionOutput[];
  output_name?: string; output_type?: string; output_quantity?: number; output_unit?: string; output_expiry_date?: string;
  id: string;
  farm_id: string;
  name: string;
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
  start_date?: string;
  end_date?: string;
  notes?: string;
  raw_materials?: { raw_material_id: string; quantity_used: number; unit: string }[];
}

export interface UpdateBatchRequest {
  outputs?: ProductionOutput[];
  output_name?: string; output_type?: string; output_quantity?: number; output_unit?: string; output_expiry_date?: string;
  name?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  status?: BatchStatus;
}

export interface CreateStepRequest {
  step_order: number;
  name: string;
  description?: string;
  variables?: StepVariable[];
}

export interface UpdateStepRequest {
  status?: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  step_order?: number;
  name?: string;
  description?: string;
  variables?: StepVariable[];
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
  search?: string;
}

export const BATCH_STATUS_TRANSITIONS: Record<BatchStatus, BatchStatus[]> = {
  PLANNED:     ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED',   'CANCELLED'],
  COMPLETED:   [],
  CANCELLED:   [],
};

export interface StepVariable { name: string; value: string; }
