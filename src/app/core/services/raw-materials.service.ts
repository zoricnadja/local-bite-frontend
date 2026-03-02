import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api.models';
import { RawMaterialListQuery, RawMaterial, RawMaterialRequest, AdjustQuantityRequest } from '../../shared/models/raw-material.models';

@Injectable({ providedIn: 'root' })
export class RawMaterialsService {
  private readonly BASE = '/api/raw-materials/raw-materials';

  constructor(private http: HttpClient) {}

  list(query: RawMaterialListQuery = {}): Observable<PaginatedResponse<RawMaterial>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<PaginatedResponse<RawMaterial>>(this.BASE, { params });
  }

  lowStock(): Observable<RawMaterial[]> {
    return this.http.get<RawMaterial[]>(`${this.BASE}/low-stock`);
  }

  getById(id: string): Observable<ApiResponse<RawMaterial>> {
    return this.http.get<ApiResponse<RawMaterial>>(`${this.BASE}/${id}`);
  }

  create(req: RawMaterialRequest): Observable<ApiResponse<RawMaterial>> {
    return this.http.post<ApiResponse<RawMaterial>>(this.BASE, req);
  }

  update(id: string, req: RawMaterialRequest): Observable<ApiResponse<RawMaterial>> {
    return this.http.put<ApiResponse<RawMaterial>>(`${this.BASE}/${id}`, req);
  }

  adjust(id: string, req: AdjustQuantityRequest): Observable<ApiResponse<RawMaterial>> {
    return this.http.post<ApiResponse<RawMaterial>>(`${this.BASE}/${id}/adjust`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
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
