import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FarmService } from '../../../core/services/farm.service';
import {RegisterRequest, WorkerOut} from '../../../shared/models/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-add-worker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './add-worker.component.html',
  styleUrl: 'add-worker.component.css'
})
export class AddWorkerComponent {
  private fb = new FormBuilder();
  private farmApi = inject(FarmService);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  worker = signal<WorkerOut | null>(null);
  farmId = this.auth.farmId;

  form = this.fb.group({
    // Account
    email:      ['', [Validators.required, Validators.email]],
    password:   ['', [Validators.required, Validators.minLength(6)]],

    // Required profile
    first_name: ['', Validators.required],
    last_name:  ['', Validators.required],
    address:    ['', Validators.required],

    // Optional profile
    phone:         [''],
    date_of_birth: [''],
  });


  submit(): void {
  if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');
    const fid = this.farmId()!
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
    this.farmApi.addWorker(fid, req).subscribe({
      next: (res) => {
        this.worker.set(res.data as unknown as WorkerOut);
        this.loading.set(false);
        console.log(this.worker())
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error || 'Failed to add worker';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
