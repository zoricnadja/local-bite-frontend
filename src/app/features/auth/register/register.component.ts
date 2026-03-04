import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import {RegisterRequest} from "../../../shared/models/auth.models";

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
    templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    // Account
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(6)]],
    role:       ['CUSTOMER'],

    // Required profile
    first_name: ['', Validators.required],
    last_name:  ['', Validators.required],
    address:    ['', Validators.required],

    // Optional profile
    phone:         [''],
    date_of_birth: [''],
  });

  loading = signal(false);
  error   = signal('');

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const v = this.form.getRawValue();
    const req: RegisterRequest = {
      email:      v.email!,
      password:   v.password!,
      role:       v.role ?? undefined,
      first_name: v.first_name!,
      last_name:  v.last_name!,
      address:    v.address!,
      phone:         v.phone         || undefined,
      date_of_birth: v.date_of_birth || undefined,
    };

    this.auth.register(req).subscribe({
      next: () => {
        this.auth.refreshUser().subscribe({
          next: ()  => this.router.navigate(['/dashboard']),
          error: (err) => this.error.set(err.error?.error ?? 'Failed to load user'),
        });
      },
      error: (e) => {
        this.error.set(e.error?.error ?? 'Registration failed');
        this.loading.set(false);
      },
    });
  }
}