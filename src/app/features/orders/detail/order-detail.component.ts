import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderStatus, ORDER_STATUS_TRANSITIONS } from '../../../shared/models/order.models';
import {OrdersService} from "../../../core/services/orders.service";

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (order()) {

        <div class="page-header">
          <div>
            <h1 class="page-title">Order <span class="font-mono" style="font-size:1.2rem">#{{ order()!.id.slice(0,8) }}</span></h1>
            <p class="page-subtitle">
              <span [class]="statusClass(order()!.status)">{{ order()!.status }}</span>
              &nbsp;· {{ order()!.created_at | date:'medium' }}
            </p>
          </div>
          <div class="actions">
            @if (canDelete()) {
              <button class="btn btn-danger" (click)="confirmDelete()">🗑️ Delete</button>
            }
          </div>
        </div>

        <!-- Status stepper -->
        <div class="card" style="margin-bottom:20px">
          <div class="stepper">
            @for (s of allStatuses; track s) {
              <div class="step" [class.active]="order()!.status === s" [class.done]="isPast(s)">
                <div class="step-dot"></div>
                <div class="step-label">{{ s }}</div>
              </div>
              @if (s !== 'CANCELLED' && s !== 'DELIVERED') {
                <div class="step-line" [class.done]="isPast(s)"></div>
              }
            }
          </div>

          @if (nextStatuses().length > 0) {
            <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
              <span style="font-size:0.875rem;color:var(--text-muted);align-self:center">Advance to:</span>
              @for (s of nextStatuses(); track s) {
                <button class="btn btn-sm btn-primary" (click)="updateStatus(s)" [disabled]="updating()">
                  → {{ s }}
                </button>
              }
            </div>
          }
        </div>

        <div class="detail-layout">

          <!-- Customer + notes -->
          <div class="card">
            <h3 style="margin-bottom:16px">Customer</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Name</div>
                <div class="info-value">{{ order()!.customer_name ?? 'Walk-in customer' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">{{ order()!.customer_email ?? '—' }}</div>
              </div>
            </div>
            @if (order()!.notes) {
              <div style="margin-top:16px">
                <div class="info-label">Notes</div>
                <p style="margin-top:6px;font-size:0.9rem;color:var(--text-secondary)">{{ order()!.notes }}</p>
              </div>
            }
          </div>

          <!-- Order items -->
          <div class="card" style="margin-top:16px">
            <h3 style="margin-bottom:16px">Items</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Type</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                @for (item of order()!.items; track item.id) {
                  <tr>
                    <td><strong>{{ item.product_name }}</strong></td>
                    <td><span class="badge badge-planned">{{ item.product_type }}</span></td>
                    <td class="font-mono">€{{ item.unit_price.toFixed(2) }} / {{ item.unit }}</td>
                    <td class="font-mono">{{ item.quantity }}</td>
                    <td><strong>€{{ item.subtotal.toFixed(2) }}</strong></td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4" style="text-align:right;font-weight:700;padding:12px 16px">Total</td>
                  <td style="font-family:var(--font-display);font-size:1.3rem;font-weight:700;color:var(--accent);padding:12px 16px">
                    €{{ order()!.total_price.toFixed(2) }}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .detail-layout { display: flex; flex-direction: column; max-width: 800px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px; }
    .info-value { font-size: 0.95rem; font-weight: 600; }
    tfoot tr { border-top: 2px solid var(--border); }

    .stepper { display: flex; align-items: center; gap: 0; flex-wrap: wrap; }
    .step { display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .step-dot { width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--border-strong); background: var(--surface); transition: all 0.2s; }
    .step.active .step-dot { background: var(--accent); border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
    .step.done .step-dot { background: var(--accent); border-color: var(--accent); }
    .step-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); white-space: nowrap; }
    .step.active .step-label { color: var(--accent); }
    .step.done .step-label { color: var(--text-secondary); }
    .step-line { flex: 1; height: 2px; background: var(--border); min-width: 24px; margin-bottom: 20px; transition: background 0.2s; }
    .step-line.done { background: var(--accent); }
  `]
})
export class OrderDetailComponent implements OnInit {
  private svc    = inject(OrdersService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  order    = signal<Order | null>(null);
  loading  = signal(true);
  updating = signal(false);

  readonly allStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  readonly statusOrder = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  private id = '';

  nextStatuses = () => {
    const o = this.order();
    if (!o) return [];
    return ORDER_STATUS_TRANSITIONS[o.status] ?? [];
  };

  canDelete = () => {
    const s = this.order()?.status;
    return s === 'PENDING' || s === 'CANCELLED';
  };

  isPast(status: OrderStatus): boolean {
    const o = this.order();
    if (!o) return false;
    const currentIdx = this.statusOrder.indexOf(o.status);
    const checkIdx   = this.statusOrder.indexOf(status);
    return checkIdx < currentIdx;
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.load();
  }

  load() {
    this.svc.getById(this.id).subscribe({
      next: res => {
        this.order.set(res.data);
        this.updating.set(false);
        this.loading.set(false)
      },error: ()  => this.loading.set(false),
    });
  }

  updateStatus(status: OrderStatus) {
    this.updating.set(true);
    this.svc.updateStatus(this.id, { status }).subscribe({
      next:  res => { console.log(res); this.order.set(res.data); this.updating.set(false); },
      error: ()  => this.updating.set(false),
    });
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

  confirmDelete() {
    if (!confirm('Delete this order?')) return;
    this.svc.delete(this.id).subscribe(() => this.router.navigate(['/orders']));
  }
}
