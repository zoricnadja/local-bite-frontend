import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FarmService } from '../../../core/services/farm.service';
import {CreateFarmRequest, Farm} from '../../../shared/models/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-create-farm',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page">
      <h1 class="page-title">Create Farm</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="card">
        <label class="form-label">Farm name</label>
        <input class="input" formControlName="name" type="text" placeholder="e.g. Sunny Acres" />
        <div class="hint error" *ngIf="form.controls.name.touched && form.controls.name.invalid">
          Name is required (min 2 characters)
        </div>

        <button class="btn primary" type="submit" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Creating…' : 'Create farm' }}
        </button>
      </form>

      <div class="alert success" *ngIf="farm() as f">
        <strong>Farm created!</strong>
        <div>ID: {{ f.id }}</div>
        <div>Name: {{ f.name }}</div>
      </div>

      <div class="alert error" *ngIf="error()">{{ error() }}</div>
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
export class CreateFarmComponent {
  private fb = new FormBuilder();
  private farmApi = inject(FarmService);
  private auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  farm = signal<Farm | null>(null);

  form = this.fb.group<CreateFarmRequest>({
    name: this.fb.nonNullable.control('', { validators: [Validators.required, Validators.minLength(2)] })
  } as any);

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);
    const req: CreateFarmRequest = { name: this.form.value.name!.trim() };
    this.farmApi.createFarm(req).subscribe({
      next: (res) => {
        // Save new token with farm_id and refresh user profile
        this.auth.setToken((res.data).token);
        this.farm.set((res.data).farm);
        this.auth.refreshUser().subscribe({
          next: () => this.loading.set(false),
          error: () => this.loading.set(false),
        });
      },
      error: (err) => {
        const msg = err?.error?.error || err?.error || 'Failed to create farm';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
