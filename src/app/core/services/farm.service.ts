import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api.models';
import {
  AddWorkerRequest,
  CreateFarmRequest,
  CreateFarmResult,
  Farm,
  UpdateFarmRequest,
  WorkerOut
} from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class FarmService {
  private readonly BASE = '/api/auth/farms';
  constructor(private http: HttpClient) {}

  createFarm(req: CreateFarmRequest): Observable<Farm> {
    return this.http.post<Farm>(this.BASE, req);
  }

  update(id: string, req: UpdateFarmRequest): Observable<ApiResponse<Farm>> {
    return this.http.put<ApiResponse<Farm>>(`${this.BASE}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  addWorker(farmId: string, req: AddWorkerRequest): Observable<ApiResponse<WorkerOut>> {
    return this.http.post<ApiResponse<WorkerOut>>(`${this.BASE}/${farmId}/workers`, req);
  }

  getById(id: string): Observable<ApiResponse<Farm>> {
    return this.http.get<ApiResponse<Farm>>(`${this.BASE}/${id}`);
  }

  listWorkers(farmId: string): Observable<ApiResponse<WorkerOut>> {
    // Backend returns workers array wrapped in standard ApiResponse; component will unwrap flexibly
    return this.http.get<ApiResponse<WorkerOut>>(`${this.BASE}/${farmId}/workers`);
  }
}
