import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { PaginatedResponse, ApiResponse } from '../../shared/models/api.models';
import {
  OrderListQuery,
  Order,
  CreateOrderRequest,
  UpdateStatusRequest,
  AnalyticsResponse,
  CreatesOrdersResponse
} from '../../shared/models/order.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly BASE = '/api/orders';

  constructor(private http: HttpClient) {}

  list(query: OrderListQuery = {}): Observable<ApiResponse<PaginatedResponse<Order>>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<ApiResponse<PaginatedResponse<Order>>>(this.BASE, { params });
  }

  getAllByUser(userId: string, query: OrderListQuery = {}): Observable<ApiResponse<PaginatedResponse<Order>>> {
    const params = this.buildParams(query as Record<string, unknown>);
    return this.http.get<ApiResponse<PaginatedResponse<Order>>>(`${this.BASE}/user/${userId}`, { params });
  }

  getById(id: string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.BASE}/${id}`);
  }

  private auth = inject(AuthService);
  private clearCheckout(key: string): void {
    try { if (JSON.parse(sessionStorage.getItem('lb_checkout') ?? 'null')?.key === key) sessionStorage.removeItem('lb_checkout'); } catch { sessionStorage.removeItem('lb_checkout'); }
  }

  create(req: CreateOrderRequest): Observable<ApiResponse<CreatesOrdersResponse>> {
    const body = JSON.stringify(req);
    const customer = this.auth.id();
    let pending: { body: string; key: string; customer: string | null } | null = null;
    try { pending = JSON.parse(sessionStorage.getItem('lb_checkout') ?? 'null'); } catch { /* discard invalid local state */ }
    if (pending?.body !== body || pending?.customer !== customer) pending = { body, key: crypto.randomUUID(), customer };
    const key = pending.key;
    sessionStorage.setItem('lb_checkout', JSON.stringify(pending));
    return this.http.post<ApiResponse<CreatesOrdersResponse>>(this.BASE, req, {
      headers: { 'Idempotency-Key': key },
    }).pipe(tap({
      next: () => this.clearCheckout(key),
      error: error => {
        // An ambiguous network result must retain the key, including after page reload.
        if (error.status >= 400 && error.status < 500 && !String(error.error?.error).includes('Checkout is pending')) this.clearCheckout(key);
      },
    }));
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
