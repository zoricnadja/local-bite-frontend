import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../shared/models/api.models';
import { AddWorkerRequest, CreateFarmRequest, Farm, WorkerOut } from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class FarmService {
  private readonly BASE = '/api/auth/farms';
  constructor(private http: HttpClient) {}

  createFarm(req: CreateFarmRequest): Observable<ApiResponse<{ farm: Farm; token: string }>> {
    return this.http.post<ApiResponse<{ farm: Farm; token: string }>>(this.BASE, req);
  }

  addWorker(farmId: string, req: AddWorkerRequest): Observable<ApiResponse<WorkerOut>> {
    return this.http.post<ApiResponse<WorkerOut>>(`${this.BASE}/${farmId}/workers`, req);
  }
}
