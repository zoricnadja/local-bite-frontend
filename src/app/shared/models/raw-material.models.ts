export interface RawMaterial {
  id: string;
  farm_id: string;
  name: string;
  material_type: string;
  quantity: number;
  unit: string;
  supplier: string | null;
  origin: string | null;
  harvest_date: string | null;
  expiry_date: string | null;
  notes: string | null;
  low_stock_threshold: number | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface RawMaterialRequest {
  name?: string;
  material_type?: string;
  quantity?: number;
  unit?: string;
  supplier?: string;
  origin?: string;
  harvest_date?: string;
  expiry_date?: string;
  notes?: string;
  low_stock_threshold?: number;
}

export interface AdjustQuantityRequest {
  delta: number;
  reason?: string;
}

export interface RawMaterialListQuery {
  page?: number;
  limit?: number;
  material_type?: string;
  search?: string;
}
