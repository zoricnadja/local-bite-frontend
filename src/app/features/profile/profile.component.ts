import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { FarmService } from '../../core/services/farm.service';
import { Farm } from '../../shared/models/auth.models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <h1 class="page-title">Profile</h1>

      <div class="card">
        <h2>User</h2>
        <div>Email: {{ user()?.email }}</div>
        <div>Role: {{ user()?.role }}</div>
        <div>Joined: {{ user()?.created_at | date:'medium' }}</div>
      </div>

      <div class="card">
        <h2>Farm</h2>
        <ng-container *ngIf="farmId(); else noFarm">
          <ng-container *ngIf="farm() as f; else loadingOrErr">
            <div>Name: {{ f.name }}</div>
            <div>Created: {{ f.created_at | date:'medium' }}</div>
          </ng-container>
          <ng-template #loadingOrErr>
            <div class="hint" *ngIf="loading()">Loading farm…</div>
            <div class="alert" *ngIf="!loading() && error()">{{ error() }}</div>
          </ng-template>
        </ng-container>
        <ng-template #noFarm>
          <div class="alert">
            You don't have a farm yet.
          </div>
          <a class="btn primary" routerLink="/farm/create">Add farm</a>
        </ng-template>
      </div>
    </div>
  `,
  styles: [
    `.page{max-width:720px;margin:24px auto;padding:0 16px}`,
    `.page-title{margin-bottom:16px}`,
    `.card{margin-top:16px;padding:16px;border:1px solid var(--border,#ddd);border-radius:8px;background:var(--surface,#fff)}`,
    `.btn{display:inline-block;margin-top:12px;padding:10px 14px;border:none;border-radius:6px;cursor:pointer;text-decoration:none}`,
    `.btn.primary{background:#2563eb;color:#fff}`,
    `.alert{margin-top:8px;padding:10px;border-radius:6px;background:#fef3c7;color:#92400e}`,
  ]
})
export class ProfileComponent {
  private auth = inject(AuthService);
  private farms = inject(FarmService);
  readonly user   = this.auth.currentUser;
  readonly farmId = this.auth.farmId;

  farm   = signal<Farm | null>(null);
  loading = signal(false);
  error   = signal<string | null>(null);

  // Load farm details when farmId appears/changes
  private _ = effect(() => {
    const id = this.farmId();
    if (!id) {
      this.farm.set(null);
      this.loading.set(false);
      this.error.set(null);
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    this.farms.getById(id).subscribe({
      next: (res) => {
        this.farm.set((res.data as unknown as Farm));
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error || 'Failed to load farm';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  });
}
