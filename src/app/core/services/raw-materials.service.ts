import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { MaterialWire, materialFromWire } from './decimal-wire';
import {ApiResponse, PaginatedResponse} from '../../shared/models/api.models';
import { RawMaterialListQuery, RawMaterial, RawMaterialRequest, AdjustQuantityRequest } from '../../shared/models/raw-material.models';

@Injectable({ providedIn: 'root' })
export class RawMaterialsService {
  private readonly BASE = '/api/raw-materials';

  constructor(private http: HttpClient) {}

  list(query: RawMaterialListQuery = {}): Observable<ApiResponse<PaginatedResponse<RawMaterial>>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<ApiResponse<PaginatedResponse<MaterialWire>>>(this.BASE, { params }).pipe(map(r => ({ ...r, data: { ...r.data, data: r.data.data.map(materialFromWire) } })));
  }

  lowStock(): Observable<ApiResponse<RawMaterial[]>> {
    return this.http.get<ApiResponse<MaterialWire[]>>(`${this.BASE}/low-stock`).pipe(map(r => ({ ...r, data: r.data.map(materialFromWire) })));
  }

  getById(id: string): Observable<ApiResponse<RawMaterial>> {
    return this.http.get<ApiResponse<MaterialWire>>(`${this.BASE}/${id}`).pipe(map(r => ({ ...r, data: materialFromWire(r.data) })));
  }

  create(req: RawMaterialRequest): Observable<ApiResponse<RawMaterial>> {
    return this.http.post<ApiResponse<MaterialWire>>(this.BASE, req).pipe(map(r => ({ ...r, data: materialFromWire(r.data) })));
  }

  update(id: string, req: RawMaterialRequest): Observable<ApiResponse<RawMaterial>> {
    return this.http.put<ApiResponse<MaterialWire>>(`${this.BASE}/${id}`, req).pipe(map(r => ({ ...r, data: materialFromWire(r.data) })));
  }

  adjust(id: string, req: AdjustQuantityRequest): Observable<ApiResponse<RawMaterial>> {
    return this.http.post<ApiResponse<MaterialWire>>(`${this.BASE}/${id}/adjust`, req).pipe(map(r => ({ ...r, data: materialFromWire(r.data) })));
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
