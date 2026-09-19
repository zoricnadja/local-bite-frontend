import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { OrdersService } from './orders.service';
import { AuthService } from '../auth/auth.service';

describe('Checkout recovery', () => {
  let http: HttpTestingController;
  const cart = { items: [{ product_id: 'product', quantity: 1 }] };
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { id: () => 'customer' } }] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); sessionStorage.clear(); });
  it('retains a key after ambiguous failure and across service recreation', () => {
    TestBed.inject(OrdersService).create(cart).subscribe({ error: () => {} });
    const first = http.expectOne('/api/orders');
    const key = first.request.headers.get('Idempotency-Key');
    first.flush({}, { status: 503, statusText: 'Unavailable' });
    const recreated = TestBed.runInInjectionContext(() => new OrdersService(TestBed.inject(importHttpClient)));
    recreated.create(cart).subscribe();
    const retry = http.expectOne('/api/orders');
    expect(retry.request.headers.get('Idempotency-Key')).toBe(key);
    retry.flush({ data: { orders: [] } });
    expect(sessionStorage.getItem('lb_checkout')).toBeNull();
  });
  it('allocates a new key when the cart changes', () => {
    const service = TestBed.inject(OrdersService);
    service.create(cart).subscribe({ error: () => {} });
    const first = http.expectOne('/api/orders');
    const key = first.request.headers.get('Idempotency-Key');
    first.flush({}, { status: 503, statusText: 'Unavailable' });
    service.create({ items: [{ product_id: 'product', quantity: 2 }] }).subscribe();
    const second = http.expectOne('/api/orders');
    expect(second.request.headers.get('Idempotency-Key')).not.toBe(key);
    second.flush({ data: { orders: [] } });
  });
});
import { HttpClient as importHttpClient } from '@angular/common/http';
