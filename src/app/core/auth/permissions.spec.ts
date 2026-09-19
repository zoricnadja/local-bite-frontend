import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, it, expect } from 'vitest';
import { AuthService } from './auth.service';
import { CanDirective } from './can.directive';
import { hasPermission } from './permissions';

@Component({ imports: [CanDirective], template: `<button *appCan="'shop'">New order</button><button *appCan="'manageProducts'">Edit product</button><button *appCan="'deleteFarmData'">Delete</button><button *appCan="'analytics'">Analytics</button>` })
class ActionsHost {}
describe('Role permissions', () => {
  it('updates visible actions for customer, owner and worker', async () => {
    const role = signal<string | null>('Customer');
    await TestBed.configureTestingModule({ imports: [ActionsHost], providers: [{ provide: AuthService, useValue: { role } }] }).compileComponents();
    const fixture = TestBed.createComponent(ActionsHost); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('New order');
    role.set('FarmOwner'); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('Edit productDeleteAnalytics');
    role.set('Worker'); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('Edit product');
    role.set(null); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toBe('');
  });
  it('excludes customer from farm features and owner from purchasing', () => {
    expect(hasPermission('Customer', 'viewFarm')).toBe(false);
    expect(hasPermission('Customer', 'manageProduction')).toBe(false);
    expect(hasPermission('Customer', 'viewMaterials')).toBe(false);
    expect(hasPermission('FarmOwner', 'shop')).toBe(false);
    expect(hasPermission('Worker', 'analytics')).toBe(false);
  });
});
