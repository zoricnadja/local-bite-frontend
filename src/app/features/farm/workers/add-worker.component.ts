import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FarmService } from '../../../core/services/farm.service';
import { AddWorkerRequest, WorkerOut } from '../../../shared/models/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-add-worker',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Add Worker</h1>

      <ng-container *ngIf="farmId() as fid; else noFarm">
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
          <label class="form-label">Worker email</label>
          <input class="input" formControlName="email" type="email" placeholder="worker@example.com" />
          <div class="hint error" *ngIf="form.controls.email.touched && form.controls.email.invalid">
            Valid email is required
          </div>

          <label class="form-label">Password</label>
          <input class="input" formControlName="password" type="password" placeholder="At least 6 characters" />
          <div class="hint error" *ngIf="form.controls.password.touched && form.controls.password.invalid">
            Password is required (min 6 characters)
          </div>

          <label class="form-label">Confirm password</label>
          <input class="input" formControlName="confirm" type="password" />
          <div class="hint error" *ngIf="confirmInvalid()">Passwords do not match</div>

          <button class="btn primary" type="submit" [disabled]="form.invalid || confirmInvalid() || loading()">
            {{ loading() ? 'Adding…' : 'Add worker' }}
          </button>
        </form>

        <div class="alert success" *ngIf="worker() as w">
          <strong>Worker created!</strong>
          <div>ID: {{ w.id }}</div>
          <div>Email: {{ w.email }}</div>
        </div>

        <div class="alert error" *ngIf="error()">{{ error() }}</div>
      </ng-container>

      <ng-template #noFarm>
        <div class="alert error">
          You don't have a farm assigned yet. Create a farm first, then reopen this page.
        </div>
      </ng-template>
    </div>
  `,
  styles: [
    `.page{max-width:640px;margin:24px auto;padding:0 16px}`,
    `.page-title{margin-bottom:16px}`,
    `.card{display:flex;flex-direction:column;gap:12px;padding:16px;border:1px solid var(--border,#ddd);border-radius:8px;background:var(--surface,#fff)}`,
    `.form-label{font-weight:600}`,
    `.input{padding:10px 12px;border:1px solid #ccc;border-radius:6px}`,
    `.btn{padding:10px 14px;border:none;border-radius:6px;cursor:pointer}`,
    `.btn.primary{background:#2563eb;color:#fff}`,
    `.alert{margin-top:16px;padding:12px;border-radius:6px}`,
    `.alert.success{background:#ecfdf5;color:#065f46}`,
    `.alert.error{background:#fef2f2;color:#991b1b}`,
    `.hint.error{color:#b91c1c;font-size:.875rem}`,
  ]
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
    email: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.email] }),
    password: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(6)] }),
    confirm: this.fb.nonNullable.control('', { validators: [Validators.required] }),
  });

  confirmInvalid(): boolean {
    const v = this.form.value;
    return !!v.confirm && !!v.password && v.confirm !== v.password;
  }

  onSubmit(): void {
    const fid = this.farmId();
    if (!fid || this.form.invalid || this.confirmInvalid() || this.loading()) return;
    this.loading.set(true);
    this.error.set(null);
    const req: AddWorkerRequest = {
      email: this.form.value.email!,
      password: this.form.value.password!,
    };
    this.farmApi.addWorker(fid, req).subscribe({
      next: (res) => {
        this.worker.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || 'Failed to add worker';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
