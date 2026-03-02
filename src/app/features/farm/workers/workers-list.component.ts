import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FarmService } from '../../../core/services/farm.service';
import { WorkerOut } from '../../../shared/models/auth.models';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-workers-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page">
      <div class="header">
        <h1 class="page-title">Workers</h1>
        <a class="btn primary" [routerLink]="['/farm','workers','add']">Add worker</a>
      </div>

      <ng-container *ngIf="farmId() as fid; else noFarm">
        <div class="card" *ngIf="!loading(); else loadingTpl">
          <table class="table" *ngIf="workers().length; else emptyTpl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Worker ID</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let w of workers()">
                <td>{{ w.email }}</td>
                <td>{{ w.role }}</td>
                <td class="mono">{{ w.id }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <ng-template #loadingTpl>
          <div class="card">Loading workers…</div>
        </ng-template>
        <ng-template #emptyTpl>
          <div class="empty">No workers yet. Click "Add worker" to invite someone.</div>
        </ng-template>
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
    `.page{max-width:900px;margin:24px auto;padding:0 16px}`,
    `.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}`,
    `.page-title{margin:0}`,
    `.card{padding:16px;border:1px solid var(--border,#ddd);border-radius:8px;background:var(--surface,#fff)}`,
    `.table{width:100%;border-collapse:collapse}`,
    `.table th,.table td{padding:10px;border-bottom:1px solid #eee;text-align:left}`,
    `.btn{padding:10px 14px;border:none;border-radius:6px;cursor:pointer;text-decoration:none;display:inline-block}`,
    `.btn.primary{background:#2563eb;color:#fff}`,
    `.alert{margin-top:16px;padding:12px;border-radius:6px}`,
    `.alert.error{background:#fef2f2;color:#991b1b}`,
    `.empty{color:#666}`,
    `.mono{font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size:.9em}`,
  ]
})
export class WorkersListComponent implements OnInit {
  private farmApi = inject(FarmService);
  private auth = inject(AuthService);

  farmId = this.auth.farmId; // signal<string | null>
  loading = signal(true);
  error = signal<string | null>(null);
  workers = signal<WorkerOut[]>([]);

  ngOnInit(): void {
    const fid = this.farmId();
    if (!fid) {
      this.loading.set(false);
      return;
    }
    this.load(fid);
  }

  private load(fid: string) {
    this.loading.set(true);
    this.error.set(null);
    this.farmApi.listWorkers(fid).subscribe({
      next: (res: any) => {
        // Support both shapes: { data: { data: WorkerOut[] } } and { data: WorkerOut[] }
        const payload = res?.data;
        const list: WorkerOut[] = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        this.workers.set(list);
        this.loading.set(false);
      },
      error: (err) => {
        const msg = err?.error?.error || err?.message || 'Failed to load workers';
        this.error.set(msg);
        this.loading.set(false);
      }
    });
  }
}
