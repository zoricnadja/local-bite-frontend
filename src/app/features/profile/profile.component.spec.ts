import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { ProfileComponent } from './profile.component';
import { AuthService } from '../../core/auth/auth.service';
import { FarmService } from '../../core/services/farm.service';
import { UserService } from '../../core/services/users.service';

describe('Worker profile', () => {
  it('shows the assigned farm without farm management or account deletion', async () => {
    await TestBed.configureTestingModule({ imports: [ProfileComponent], providers: [provideRouter([]),
      { provide: AuthService, useValue: {
        currentUser: signal({ id: 'worker', first_name: 'Test', last_name: 'Worker', role: 'Worker', farm_id: 'farm' }),
        farmId: signal('farm'), role: signal('Worker'), isCustomer: () => false,
      } },
      { provide: FarmService, useValue: { getById: () => of({ data: { id: 'farm', name: 'Assigned farm', address: 'Farm address' } }) } },
      { provide: UserService, useValue: {} },
    ] }).compileComponents();
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Assigned farm');
    expect(text).toContain('Farm address');
    expect(text).not.toContain('Delete account');
    expect(text).not.toContain('Delete farm');
    expect(text).not.toContain('Add farm');
  });
});
