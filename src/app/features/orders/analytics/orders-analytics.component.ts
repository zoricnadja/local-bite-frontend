import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {AnalyticsResponse} from '../../../shared/models/order.models';
import {OrdersService} from "../../../core/services/orders.service";

@Component({
  selector: 'app-orders-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Analytics</h1>
          <p class="page-subtitle">Revenue and order performance</p>
        </div>
        <a routerLink="/orders" class="btn btn-secondary">← Orders</a>
      </div>

      <!-- Date range -->
      <div class="search-bar" style="margin-bottom:24px">
        <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
          <label class="form-label" style="margin:0;white-space:nowrap">From</label>
          <input class="form-control" type="date" [(ngModel)]="from" style="width:auto" />
        </div>
        <div class="form-group" style="flex-direction:row;align-items:center;gap:8px;margin:0">
          <label class="form-label" style="margin:0;white-space:nowrap">To</label>
          <input class="form-control" type="date" [(ngModel)]="to" style="width:auto" />
        </div>
        <button class="btn btn-secondary" (click)="load()">Apply</button>
      </div>

      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (data()) {

        <!-- Summary cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">💰</div>
            <div class="stat-body">
              <div class="stat-value">€{{ data()!.total_revenue.toFixed(2) }}</div>
              <div class="stat-label">Total Revenue</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🛒</div>
            <div class="stat-body">
              <div class="stat-value">{{ data()!.total_orders }}</div>
              <div class="stat-label">Total Orders</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-body">
              <div class="stat-value">
                {{ deliveredCount() }}
              </div>
              <div class="stat-label">Delivered</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⏳</div>
            <div class="stat-body">
              <div class="stat-value">{{ pendingCount() }}</div>
              <div class="stat-label">Pending</div>
            </div>
          </div>
        </div>

        <!-- Status breakdown -->
        <div class="two-col" style="margin-top:24px">
          <div class="card">
            <h3 style="margin-bottom:16px">Orders by Status</h3>
            <div class="status-bars">
              @for (s of data()!.orders_by_status; track s.status) {
                <div class="status-bar-row">
                  <span [class]="statusClass(s.status)" style="min-width:90px">{{ s.status }}</span>
                  <div class="bar-track">
                    <div class="bar-fill" [style.width]="barWidth(s.count) + '%'"
                         [style.background]="barColor(s.status)"></div>
                  </div>
                  <span class="bar-count">{{ s.count }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Top products -->
          <div class="card">
            <h3 style="margin-bottom:16px">Top Products</h3>
            @if (data()!.top_products.length === 0) {
              <p class="text-muted text-sm">No delivered orders yet.</p>
            } @else {
              <div class="top-products">
                @for (p of data()!.top_products.slice(0, 8); track p.product_id; let i = $index) {
                  <div class="top-product-row">
                    <span class="rank">{{ i + 1 }}</span>
                    <span class="product-name" style="flex:1">{{ p.product_name }}</span>
                    <span class="text-muted text-sm">{{ p.total_sold }} sold</span>
                    <span style="font-weight:700;color:var(--accent);min-width:80px;text-align:right">
                      €{{ p.total_revenue.toFixed(2) }}
                    </span>
                  </div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Monthly revenue table -->
        @if (data()!.revenue_by_month.length > 0) {
          <div class="card" style="margin-top:24px">
            <h3 style="margin-bottom:16px">Revenue by Month</h3>
            <table>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Orders</th>
                  <th>Revenue</th>
                  <th>Avg Order Value</th>
                </tr>
              </thead>
              <tbody>
                @for (m of data()!.revenue_by_month; track m.month) {
                  <tr>
                    <td class="font-mono">{{ m.month }}</td>
                    <td>{{ m.orders }}</td>
                    <td><strong>€{{ m.revenue.toFixed(2) }}</strong></td>
                    <td class="text-muted">€{{ m.orders > 0 ? (m.revenue / m.orders).toFixed(2) : '0.00' }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }

      }
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
    .stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: var(--shadow-sm); }
    .stat-icon { font-size: 2rem; }
    .stat-value { font-family: var(--font-display); font-size: 1.6rem; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-top: 4px; }

    .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .two-col { grid-template-columns: 1fr; } }

    .status-bars { display: flex; flex-direction: column; gap: 10px; }
    .status-bar-row { display: flex; align-items: center; gap: 10px; }
    .bar-track { flex: 1; height: 8px; background: var(--surface-2); border-radius: 100px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 100px; transition: width 0.4s ease; }
    .bar-count { font-size: 0.85rem; font-weight: 700; min-width: 24px; text-align: right; }

    .top-products { display: flex; flex-direction: column; gap: 8px; }
    .top-product-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 0.875rem; }
    .top-product-row:last-child { border-bottom: none; }
    .rank { width: 20px; height: 20px; border-radius: 50%; background: var(--surface-2); font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  `]
})
export class OrdersAnalyticsComponent implements OnInit {
  private svc = inject(OrdersService);

  data    = signal<AnalyticsResponse | null>(null);
  loading = signal(true);

  from = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);
  to   = new Date().toISOString().slice(0, 10);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.analytics(this.from, this.to).subscribe({
      next:  res => { this.data.set(res.data); this.loading.set(false); },
      error: ()  => this.loading.set(false),
    });
  }

  deliveredCount(): number {
    return this.data()!.orders_by_status.find(s => s.status === 'DELIVERED')?.count ?? 0;
  }

  pendingCount(): number {
    return this.data()!.orders_by_status.find(s => s.status === 'PENDING')?.count ?? 0;
  }

  maxCount(): number {
    return Math.max(...this.data()!.orders_by_status.map(s => s.count), 1);
  }

  barWidth(count: number): number {
    return Math.round((count / this.maxCount()) * 100);
  }

  barColor(status: string): string {
    const map: Record<string, string> = {
      PENDING:   '#b5451b',
      CONFIRMED: '#1a5276',
      SHIPPED:   '#6c3483',
      DELIVERED: '#2d6a4f',
      CANCELLED: '#9c9088',
    };
    return map[status] ?? '#9c9088';
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PENDING:   'badge badge-pending',
      CONFIRMED: 'badge badge-confirmed',
      SHIPPED:   'badge badge-shipped',
      DELIVERED: 'badge badge-delivered',
      CANCELLED: 'badge badge-cancelled',
    };
    return map[status] ?? 'badge badge-planned';
  }
}
