import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ApiResponse } from '../../shared/models/api.models';
import {
  AddWorkerRequest,
  CreateBusinessRequest,
  CreateBusinessResult,
  Business,
  UpdateBusinessRequest,
  WorkerOut
} from '../../shared/models/auth.models';

@Injectable({ providedIn: 'root' })
export class BusinessService {
  private readonly BASE = '/api/auth/businesses';
  constructor(private http: HttpClient, private auth: AuthService) {}

  createBusiness(req: CreateBusinessRequest): Observable<Business> {
    return this.http.post<ApiResponse<CreateBusinessResult>>(this.BASE, req).pipe(
      tap(response => this.auth.setToken(response.data.token)),
      map(response => response.data.business)
    );
  }

  update(id: string, req: UpdateBusinessRequest): Observable<ApiResponse<Business>> {
    return this.http.put<ApiResponse<Business>>(`${this.BASE}/${id}`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  addWorker(businessId: string, req: AddWorkerRequest): Observable<ApiResponse<WorkerOut>> {
    return this.http.post<ApiResponse<WorkerOut>>(`${this.BASE}/${businessId}/workers`, req);
  }

  getById(id: string): Observable<ApiResponse<Business>> {
    return this.http.get<ApiResponse<Business>>(`${this.BASE}/${id}`);
  }

  listWorkers(businessId: string): Observable<ApiResponse<WorkerOut[]>> {
    return this.http.get<ApiResponse<WorkerOut[]>>(`${this.BASE}/${businessId}/workers`);
  }
}
