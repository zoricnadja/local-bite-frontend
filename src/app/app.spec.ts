import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppComponent } from './app';
import { AuthService } from './core/auth/auth.service';

describe('Role navigation', () => {
  it('shows shopping navigation without business administration to customers', async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: {
        role: signal('Customer'), isLoggedIn: signal(true), currentUser: signal({ email: 'customer@example.com', role: 'Customer' }),
      } }],
    }).compileComponents();
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav').textContent;
    expect(nav).toContain('Products');
    expect(nav).toContain('Orders');
    expect(nav).not.toContain('Employees');
    expect(nav).not.toContain('Production');
    expect(nav).not.toContain('Raw Materials');
  });
});
