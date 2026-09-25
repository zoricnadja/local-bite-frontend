import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/auth/auth.service';
import { BusinessService } from '../../core/services/business.service';
import { UserService } from '../../core/services/users.service';

describe('Worker profile', () => {
  it('shows the assigned business without business management or account deletion', async () => {
    await TestBed.configureTestingModule({ imports: [ProfileComponent], providers: [provideRouter([]),
      { provide: AuthService, useValue: {
        currentUser: signal({ id: 'worker', first_name: 'Test', last_name: 'Worker', role: 'Worker', business_id: 'business' }),
        businessId: signal('business'), role: signal('Worker'), isCustomer: () => false,
      } },
      { provide: BusinessService, useValue: { getById: () => of({ data: { id: 'business', name: 'Assigned business', address: 'Business address' } }) } },
      { provide: UserService, useValue: {} },
    ] }).compileComponents();
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Assigned business');
    expect(text).toContain('Business address');
    expect(text).not.toContain('Delete account');
    expect(text).not.toContain('Delete business');
    expect(text).not.toContain('Add your business');
  });
});
