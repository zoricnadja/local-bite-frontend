import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../../../core/services/production.service';
import { ProductionBatch, BatchStatus } from '../../../shared/models/production.models';
import {PaginatedResponse} from "../../../shared/models/api.models";

@Component({
  selector: 'app-production-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Production Batches</h1>
          <p class="page-subtitle">{{ total() }} batches total</p>
        </div>
        <a routerLink="new" class="btn btn-primary">+ New Batch</a>
      </div>

      <div class="search-bar">
        <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()"
               placeholder="Search batches..." style="flex:1;min-width:200px" />
        <select class="form-control" style="width:auto" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">All statuses</option>
          <option value="PLANNED">Planned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select class="form-control" style="width:auto" [(ngModel)]="typeFilter" (ngModelChange)="load()">
          <option value="">All types</option>
          <option value="curing">Curing</option>
          <option value="smoking">Smoking</option>
          <option value="fermentation">Fermentation</option>
          <option value="aging">Aging</option>
          <option value="drying">Drying</option>
          <option value="other">Other</option>
        </select>
      </div>

      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">⚙️</div>
          <div class="empty-state-text">No batches found</div>
          <a routerLink="new" class="btn btn-primary" style="margin-top:16px">Create first batch</a>
        </div>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Start</th>
                <th>End</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (b of items(); track b.id) {
                <tr>
                  <td><strong>{{ b.name }}</strong></td>
                  <td><span class="badge badge-planned">{{ b.process_type }}</span></td>
                  <td><span [class]="statusClass(b.status)">{{ b.status }}</span></td>
                  <td class="text-muted text-sm">{{ b.start_date ?? '—' }}</td>
                  <td class="text-muted text-sm">{{ b.end_date ?? '—' }}</td>
                  <td class="text-muted text-sm" style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    {{ b.notes ?? '—' }}
                  </td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="b.id" class="btn btn-sm btn-secondary">View</a>
                      <a [routerLink]="[b.id, 'edit']" class="btn btn-sm btn-ghost" title="Edit">✏️</a>
                      <button class="btn btn-sm btn-ghost" (click)="confirmDelete(b)" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (total() > pageSize) {
          <div class="pagination">
            <button class="btn btn-sm btn-secondary" [disabled]="page() === 1" (click)="setPage(page()-1)">← Prev</button>
            <span class="page-info">Page {{ page() }} of {{ totalPages() }}</span>
            <button class="btn btn-sm btn-secondary" [disabled]="page() >= totalPages()" (click)="setPage(page()+1)">Next →</button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .pagination { display:flex; align-items:center; gap:12px; margin-top:20px; justify-content:center; }
    .page-info { font-size:0.875rem; color:var(--text-muted); }
  `]
})
export class ProductionListComponent implements OnInit {
  private svc = inject(ProductionService);

  items    = signal<ProductionBatch[]>([]);
  loading  = signal(true);
  total    = signal(0);
  page     = signal(1);
  pageSize = 20;

  search       = '';
  statusFilter = '';
  typeFilter   = '';

  private searchTimer: any;
  totalPages = () => Math.ceil(this.total() / this.pageSize);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.listBatches({
      page:         this.page(),
      limit:        this.pageSize,
      search:       this.search       || undefined,
      status:       (this.statusFilter || undefined) as BatchStatus | undefined,
      process_type: this.typeFilter   || undefined,
    }).subscribe({
      next:  res => {
        this.items.set((res.data as unknown as PaginatedResponse<ProductionBatch>).data);
        this.total.set((res.data as unknown as PaginatedResponse<ProductionBatch>).total);
        this.loading.set(false);
      },
      error: ()  => this.loading.set(false),
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 300);
  }

  setPage(p: number) { this.page.set(p); this.load(); }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PLANNED:     'badge badge-planned',
      IN_PROGRESS: 'badge badge-in-progress',
      COMPLETED:   'badge badge-completed',
      CANCELLED:   'badge badge-cancelled',
    };
    return map[status] ?? 'badge badge-planned';
  }

  confirmDelete(b: ProductionBatch) {
    if (!confirm('Delete "' + b.name + '"?')) return;
    this.svc.deleteBatch(b.id).subscribe(() => this.load());
  }
}
