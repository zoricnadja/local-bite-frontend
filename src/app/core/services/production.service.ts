import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api.models';
import { BatchListQuery, ProductionBatch, CreateBatchRequest, UpdateBatchRequest, CreateStepRequest, UpdateStepRequest, AddRawMaterialRequest } from '../../shared/models/production.models';

@Injectable({ providedIn: 'root' })
export class ProductionService {
  private readonly BASE = '/api/productions';

  constructor(private http: HttpClient) {}

  listBatches(query: BatchListQuery = {}): Observable<PaginatedResponse<ProductionBatch>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<PaginatedResponse<ProductionBatch>>(`${this.BASE}/batches`, { params });
  }

  getBatch(id: string): Observable<ApiResponse<ProductionBatch>> {
    return this.http.get<ApiResponse<ProductionBatch>>(`${this.BASE}/batches/${id}`);
  }

  createBatch(req: CreateBatchRequest): Observable<ApiResponse<ProductionBatch>> {
    return this.http.post<ApiResponse<ProductionBatch>>(`${this.BASE}/batches`, req);
  }

  updateBatch(id: string, req: UpdateBatchRequest): Observable<ApiResponse<ProductionBatch>> {
    return this.http.put<ApiResponse<ProductionBatch>>(`${this.BASE}/batches/${id}`, req);
  }

  deleteBatch(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/batches/${id}`);
  }

  addStep(batchId: string, req: CreateStepRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.BASE}/batches/${batchId}/steps`, req);
  }

  updateStep(batchId: string, stepId: string, req: UpdateStepRequest): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.BASE}/batches/${batchId}/steps/${stepId}`, req);
  }

  deleteStep(batchId: string, stepId: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/batches/${batchId}/steps/${stepId}`);
  }

  addMaterial(batchId: string, req: AddRawMaterialRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.BASE}/batches/${batchId}/materials`, req);
  }

  removeMaterial(batchId: string, materialId: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/batches/${batchId}/materials/${materialId}`);
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
