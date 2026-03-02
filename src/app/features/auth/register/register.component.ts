import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  form = inject(FormBuilder).group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role:     ['FARM_OWNER'],
  });

  loading = signal(false);
  error   = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    this.auth.register(this.form.getRawValue() as any).subscribe({
      next: () =>
      {
        this.auth.refreshUser().subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: (err) => this.error.set(err.error.error),
        });
      },
      error: (e) => {
        this.error.set(e.error?.error ?? 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}