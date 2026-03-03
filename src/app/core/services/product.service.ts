import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api.models';
import { ProductListQuery, Product, ProvenanceResponse, CreateProductRequest, UpdateProductRequest } from '../../shared/models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly BASE = '/api/products';

  constructor(private http: HttpClient) {}

  list(query: ProductListQuery = {}): Observable<PaginatedResponse<Product>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<PaginatedResponse<Product>>(this.BASE, { params });
  }

  listByFarm(query: ProductListQuery = {}): Observable<PaginatedResponse<Product>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<PaginatedResponse<Product>>(`${this.BASE}/farm`, { params });
  }

  getById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.BASE}/${id}`);
  }

  getProvenance(id: string): Observable<ApiResponse<ProvenanceResponse>> {
    return this.http.get<ApiResponse<ProvenanceResponse>>(`${this.BASE}/${id}/provenance`);
  }

  create(req: CreateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.BASE, req);
  }

  update(id: string, req: UpdateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<Product>>(`${this.BASE}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  uploadImage(id: string, file: File): Observable<ApiResponse<Product>> {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<ApiResponse<Product>>(`${this.BASE}/${id}/image`, form);
  }

  imageUrl(id: string): string {
    return `${this.BASE}/${id}/image`;
  }

  qrUrl(id: string): string {
    return `${this.BASE}/${id}/qr`;
  }

  regenerateQr(id: string): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(`${this.BASE}/${id}/qr/regenerate`, {});
  }

  private buildParams(query: Record<string, unknown>): HttpParams {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    }
    return params;
  }
}
