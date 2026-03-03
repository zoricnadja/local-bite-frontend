import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api.models';
import { OrderListQuery, Order, CreateOrderRequest, UpdateStatusRequest, AnalyticsResponse } from '../../shared/models/order.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly BASE = '/api/orders';

  constructor(private http: HttpClient) {}

  list(query: OrderListQuery = {}): Observable<ApiResponse<PaginatedResponse<Order>>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<ApiResponse<PaginatedResponse<Order>>>(this.BASE, { params });
  }

  getById(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.BASE}/${id}`);
  }

  create(req: CreateOrderRequest): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.BASE, req);
  }

  updateStatus(id: string, req: UpdateStatusRequest): Observable<ApiResponse<Order>> {
    return this.http.put<ApiResponse<Order>>(`${this.BASE}/${id}/status`, req);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.BASE}/${id}`);
  }

  analytics(from?: string, to?: string): Observable<ApiResponse<AnalyticsResponse>> {
    let params = new HttpParams();
    if (from) params = params.set('from', from);
    if (to)   params = params.set('to', to);
    return this.http.get<ApiResponse<AnalyticsResponse>>(`${this.BASE}/analytics`, { params });
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
