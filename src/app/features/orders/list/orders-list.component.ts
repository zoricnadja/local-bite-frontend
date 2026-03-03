import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Order, OrderStatus } from '../../../shared/models/order.models';
import {OrdersService} from "../../../core/services/orders.service";

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Orders</h1>
          <p class="page-subtitle">{{ total() }} orders total</p>
        </div>
        <div class="actions">
          <a routerLink="/orders/analytics" class="btn btn-secondary">📊 Analytics</a>
          <a routerLink="/orders/new" class="btn btn-primary">+ New Order</a>
        </div>
      </div>

      <div class="search-bar">
        <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()"
               placeholder="Search customer name or email..." style="flex:1;min-width:200px" />
        <select class="form-control" style="width:auto" [(ngModel)]="statusFilter" (ngModelChange)="load()">
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">🛒</div>
          <div class="empty-state-text">No orders found</div>
          <a routerLink="/orders/new" class="btn btn-primary" style="margin-top:16px">Create first order</a>
        </div>
      } @else {
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Items</th>
                <th>Total</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (o of items(); track o.id) {
                <tr>
                  <td><span class="font-mono text-sm text-muted">#{{ o.id.slice(0,8) }}</span></td>
                  <td>
                    <div style="font-weight:600">{{ o.customer_name ?? 'Walk-in' }}</div>
                    @if (o.customer_email) {
                      <div class="text-muted text-sm">{{ o.customer_email }}</div>
                    }
                  </td>
                  <td><span [class]="statusClass(o.status)">{{ o.status }}</span></td>
                  <td class="text-muted text-sm">{{ o.items.length }} item{{ o.items.length === 1 ? '' : 's' }}</td>
                  <td><strong>€{{ o.total_price.toFixed(2) }}</strong></td>
                  <td class="text-muted text-sm">{{ o.created_at | date:'mediumDate' }}</td>
                  <td>
                    <div class="actions">
                      <a [routerLink]="o.id" class="btn btn-sm btn-secondary">View</a>
                      <button class="btn btn-sm btn-ghost" (click)="confirmDelete(o)"
                              [disabled]="o.status !== 'PENDING' && o.status !== 'CANCELLED'"
                              title="Delete">🗑️</button>
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
export class OrdersListComponent implements OnInit {
  private svc = inject(OrdersService);

  items    = signal<Order[]>([]);
  loading  = signal(true);
  total    = signal(0);
  page     = signal(1);
  pageSize = 20;

  search       = '';
  statusFilter = '';

  private searchTimer: any;
  totalPages = () => Math.ceil(this.total() / this.pageSize);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.list({
      page:   this.page(),
      limit:  this.pageSize,
      search: this.search       || undefined,
      status: (this.statusFilter || undefined) as OrderStatus | undefined,
    }).subscribe({
      next:  res => { console.log(res); console.log(res.data);this.items.set(res.data.data); this.total.set(res.data.total); this.loading.set(false); },
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
      PENDING:   'badge badge-pending',
      CONFIRMED: 'badge badge-confirmed',
      SHIPPED:   'badge badge-shipped',
      DELIVERED: 'badge badge-delivered',
      CANCELLED: 'badge badge-cancelled',
    };
    return map[status] ?? 'badge badge-planned';
  }

  confirmDelete(o: Order) {
    if (!confirm('Delete order #' + o.id.slice(0, 8) + '?')) return;
    this.svc.delete(o.id).subscribe(() => this.load());
  }
}
