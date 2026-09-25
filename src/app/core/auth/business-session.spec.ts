import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { BusinessService } from '../services/business.service';

describe('Business session synchronization', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });
  it('replaces a stale token and user business before the next guarded page loads', () => {
    const auth = TestBed.inject(AuthService);
    auth.setToken('old-without-business');
    auth.refreshUser().subscribe();
    http.expectOne('/api/auth/me').flush({ id: 'owner', role: 'BusinessOwner', business_id: 'business' }, { headers: { 'x-session-token': 'fresh-with-business' } });
    expect(auth.token()).toBe('fresh-with-business');
    expect(auth.businessId()).toBe('business');
    expect(localStorage.getItem('lb_token')).toBe('fresh-with-business');
  });
  it('unwraps the business creation response and saves its new token', () => {
    const auth = TestBed.inject(AuthService);
    const businesses = TestBed.inject(BusinessService);
    let id = '';
    businesses.createBusiness({ name: 'Business', address: 'Address' }).subscribe(business => id = business.id);
    http.expectOne('/api/auth/businesses').flush({ data: { business: { id: 'new-business' }, token: 'new-token' } });
    expect(id).toBe('new-business');
    expect(auth.token()).toBe('new-token');
  });
});
