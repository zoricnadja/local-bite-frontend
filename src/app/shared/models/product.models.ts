export type ProductStatus = 'PRODUCTION' | 'STORAGE' | 'ON_SALE';
export interface Product {
  status: ProductStatus;
  id: string;
  business_id: string;
  name: string;
  product_type: string;
  description: string | null;
  quantity: number;
  unit: string;
  price: number;
  expiry_date: string | null;
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
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  name: string;
  description: string | null;
  variables: { name: string; value: string }[];
}

export interface ProvenanceMaterial {
  id: string;
  name: string;
  material_type: string;
  quantity_used: number;
  unit: string;
  origin: string | null;
  supplier: string | null;
  harvest_date: string | null;
  received_date: string | null;
  expiry_date: string | null;
}

export interface ProvenanceBatch {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  steps: ProvenanceStep[];
  raw_materials: ProvenanceMaterial[];
}

export interface ProvenanceResponse {
  product: Product;
  business_name: string | null;
  batch: ProvenanceBatch | null;
}

export interface CreateProductRequest {
  name: string;
  product_type: string;
  description?: string;
  quantity: number;
  unit: string;
  price: number;
  expiry_date?: string;
  batch_id?: string;
}

export interface UpdateProductRequest {
  status?: ProductStatus;
  name?: string;
  product_type?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  price?: number;
  expiry_date?: string;
  batch_id?: string;
  is_active?: boolean;
}

export interface ProductListQuery {
  status?: ProductStatus;
  is_active?: boolean; business_id?: string;
  page?: number;
  limit?: number;
  product_type?: string;
  search?: string;
  active_only?: boolean;
}

export interface PublicProvenanceResponse {
  product: Pick<Product, 'name' | 'product_type' | 'description' | 'expiry_date' | 'qr_token'>;
  business_name: string | null;
  batch: (Pick<ProvenanceBatch, 'name' | 'start_date' | 'end_date' | 'status'> & {
    steps: Omit<ProvenanceStep, 'id'>[];
    raw_materials: Pick<ProvenanceMaterial, 'name' | 'material_type' | 'origin' | 'harvest_date'>[];
  }) | null;
}
