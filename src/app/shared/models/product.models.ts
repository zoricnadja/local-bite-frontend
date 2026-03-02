export interface Product {
  id: string;
  farm_id: string;
  name: string;
  product_type: string;
  description: string | null;
  quantity: number;
  unit: string;
  price: number;
  batch_id: string | null;
  image_path: string | null;
  qr_token: string;
  qr_path: string | null;
  is_active: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProvenanceStep {
  id: string;
  step_order: number;
  name: string;
  description: string | null;
  duration_hours: number | null;
  temperature: number | null;
}

export interface ProvenanceMaterial {
  id: string;
  name: string;
  material_type: string;
  quantity_used: number;
  unit: string;
  origin: string | null;
  supplier: string | null;
}

export interface ProvenanceBatch {
  id: string;
  name: string;
  process_type: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  steps: ProvenanceStep[];
  raw_materials: ProvenanceMaterial[];
}

export interface ProvenanceResponse {
  product: Product;
  farm_name: string | null;
  batch: ProvenanceBatch | null;
}

export interface CreateProductRequest {
  name: string;
  product_type: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  batch_id?: string;
}

export interface UpdateProductRequest {
  name?: string;
  product_type?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  batch_id?: string;
  is_active?: boolean;
}

export interface ProductListQuery {
  page?: number;
  limit?: number;
  product_type?: string;
  search?: string;
  active_only?: boolean;
}
