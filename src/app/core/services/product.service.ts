import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ProductWire, productFromWire } from './decimal-wire';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api.models';
import { ProductListQuery, Product, ProvenanceResponse, PublicProvenanceResponse, CreateProductRequest, UpdateProductRequest } from '../../shared/models/product.models';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly BASE = '/api/products';

  constructor(private http: HttpClient) {}

  list(query: ProductListQuery = {}): Observable<ApiResponse<PaginatedResponse<Product>>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<ApiResponse<PaginatedResponse<ProductWire>>>(this.BASE, { params }).pipe(map(r => ({ ...r, data: { ...r.data, data: r.data.data.map(productFromWire) } })));
  }

  listByFarm(query: ProductListQuery = {}): Observable<ApiResponse<PaginatedResponse<Product>>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<ApiResponse<PaginatedResponse<ProductWire>>>(`${this.BASE}/farm`, { params }).pipe(map(r => ({ ...r, data: { ...r.data, data: r.data.data.map(productFromWire) } })));
  }

  getById(id: string): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<ProductWire>>(`${this.BASE}/${id}`).pipe(map(r => ({ ...r, data: productFromWire(r.data) })));
  }

  getProvenance(id: string): Observable<ApiResponse<ProvenanceResponse>> {
    return this.http.get<ApiResponse<ProvenanceResponse>>(`${this.BASE}/${id}/provenance`);
  }

  getPublicProvenance(qrToken: string): Observable<ApiResponse<PublicProvenanceResponse>> {
    return this.http.get<ApiResponse<PublicProvenanceResponse>>(`${this.BASE}/public/${qrToken}`);
  }

  publicCertificateUrl(qrToken: string): string {
    return `${this.BASE}/public/${qrToken}/certificate.pdf`;
  }

  create(req: CreateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<ProductWire>>(this.BASE, req).pipe(map(r => ({ ...r, data: productFromWire(r.data) })));
  }

  update(id: string, req: UpdateProductRequest): Observable<ApiResponse<Product>> {
    return this.http.put<ApiResponse<ProductWire>>(`${this.BASE}/${id}`, req).pipe(map(r => ({ ...r, data: productFromWire(r.data) })));
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  uploadImage(id: string, file: File): Observable<ApiResponse<Product>> {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<ApiResponse<ProductWire>>(`${this.BASE}/${id}/image`, form).pipe(map(r => ({ ...r, data: productFromWire(r.data) })));
  }

  imageUrl(id: string): string {
    return `${this.BASE}/${id}/image`;
  }

  qrUrl(id: string): string {
    return `${this.BASE}/${id}/qr`;
  }

  regenerateQr(id: string): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<ProductWire>>(`${this.BASE}/${id}/qr/regenerate`, {}).pipe(map(r => ({ ...r, data: productFromWire(r.data) })));
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
