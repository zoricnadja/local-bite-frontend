import { requiredText } from '../../../shared/form-validators';
import { FieldErrorsDirective } from '../../../shared/field-errors.directive';
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BusinessService } from '../../../core/services/business.service';
import {RegisterRequest, WorkerOut} from '../../../shared/models/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-add-worker',
  standalone: true,
  imports: [FieldErrorsDirective, CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-worker.component.html',
  styleUrl: 'add-worker.component.css'
})
export class AddWorkerComponent {
  private fb = new FormBuilder();
  private businessApi = inject(BusinessService);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  worker = signal<WorkerOut | null>(null);
  businessId = this.auth.businessId;

  form = this.fb.group({
    // Account
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(6)]],

    // Required profile
    first_name: ['', requiredText],
    last_name:  ['', requiredText],
    address:    ['', requiredText],

    // Optional profile
    phone:         [''],
    date_of_birth: [''],
  });


  submit(): void {
  if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const fid = this.businessId()!
    const v = this.form.getRawValue();
    const req: RegisterRequest = {
      email:      v.email!,
      password:   v.password!,
      role:       undefined,
      first_name: v.first_name!,
      last_name:  v.last_name!,
      address:    v.address!,
      phone:         v.phone         || undefined,
      date_of_birth: v.date_of_birth || undefined,
    };
    this.businessApi.addWorker(fid, req).subscribe({
      next: (res) => {
        this.worker.set(res.data);
        this.loading.set(false);
        
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error || 'Failed to add worker';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
