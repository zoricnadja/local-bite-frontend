import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { FarmService } from '../services/farm.service';

describe('Farm session synchronization', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => { http.verify(); localStorage.clear(); });
  it('replaces a stale token and user farm before the next guarded page loads', () => {
    const auth = TestBed.inject(AuthService);
    auth.setToken('old-without-farm');
    auth.refreshUser().subscribe();
    http.expectOne('/api/auth/me').flush({ id: 'owner', role: 'FarmOwner', farm_id: 'farm' }, { headers: { 'x-session-token': 'fresh-with-farm' } });
    expect(auth.token()).toBe('fresh-with-farm');
    expect(auth.farmId()).toBe('farm');
    expect(localStorage.getItem('lb_token')).toBe('fresh-with-farm');
  });
  it('unwraps the farm creation response and saves its new token', () => {
    const auth = TestBed.inject(AuthService);
    const farms = TestBed.inject(FarmService);
    let id = '';
    farms.createFarm({ name: 'Farm', address: 'Address' }).subscribe(farm => id = farm.id);
    http.expectOne('/api/auth/farms').flush({ data: { farm: { id: 'new-farm' }, token: 'new-token' } });
    expect(id).toBe('new-farm');
    expect(auth.token()).toBe('new-token');
  });
});
