import { AuthService } from '../../../core/auth/auth.service';
import { ProducerService, Producer } from '../../../core/services/producer.service';
import { FormsModule } from '@angular/forms';
import { FieldErrorsDirective } from '../../../shared/field-errors.directive';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/models/product.models';
import {OrdersService} from "../../../core/services/orders.service";
import {Order} from "../../../shared/models/order.models";
import {PaginatedResponse} from "../../../shared/models/api.models";

interface CartItem {
  product: Product;
  quantity: number;
}

@Component({
  selector: 'app-order-form',
  standalone: true,
  imports: [FormsModule, FieldErrorsDirective, CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div><h1 class="page-title">New Order</h1></div>
        <a routerLink="/orders" class="btn btn-secondary">← Back</a>
      </div>

      <div class="order-layout">

        <p class="text-muted">Ordering as {{auth.currentUser()?.first_name}} {{auth.currentUser()?.last_name}} · {{auth.currentUser()?.email}}</p>
        <!-- Product picker -->
        <div class="card" style="margin-top:16px">
          <h3 style="margin-bottom:16px">Add Products</h3><select class="form-control" aria-label="Producer" style="margin-bottom:16px" [(ngModel)]="producerFilter" (ngModelChange)="loadProducts()"><option value="">All producers</option>@for(p of producers(); track p.id){<option [value]="p.id">{{p.name}}</option>}</select>

          @if (loadingProducts()) {
            <div style="text-align:center;padding:24px"><span class="spinner"></span></div>
          } @else {
            <div class="product-picker-grid">
              @for (p of products(); track p.id) {
                <div class="picker-card" [class.in-cart]="inCart(p.id)">
                  <div class="picker-info">
                    <div class="picker-name">{{ p.name }}</div>
                    <div class="picker-meta">
                      <span class="badge badge-planned" style="font-size:0.65rem">{{ p.product_type }}</span>
                      <span style="font-weight:700;color:var(--accent)">€{{ p.price }}</span>
                      <span class="text-muted text-sm">/ {{ p.unit }}</span>
                    </div>
                  </div>
                  @if (inCart(p.id)) {
                    <div class="qty-control">
                      <button class="qty-btn" (click)="changeQty(p.id, -1)">−</button>
                      <span class="qty-val">{{ cartQty(p.id) }}</span>
                      <button class="qty-btn" (click)="changeQty(p.id, 1)">+</button>
                    </div>
                  } @else {
                    <button class="icon-action" (click)="addToCart(p)" aria-label="Add" title="Add"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
                  }
                </div>
              }
            </div>
          }
        </div>

        <form class="card" style="margin-top:16px" [formGroup]="customerForm"><label class="form-label">Notes</label><textarea class="form-control" formControlName="notes" placeholder="Delivery instructions, special requests…"></textarea></form>
        <!-- Cart summary -->
        @if (cart().length > 0) {
          <div class="card" style="margin-top:16px">
            <h3 style="margin-bottom:16px">Order Summary</h3>
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Unit Price</th>
                  <th>Qty</th>
                  <th>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (item of cart(); track item.product.id) {
                  <tr>
                    <td><strong>{{ item.product.name }}</strong></td>
                    <td>€{{ item.product.price }} / {{ item.product.unit }}</td>
                    <td class="font-mono">{{ item.quantity }}</td>
                    <td><strong>€{{ (item.product.price * item.quantity).toFixed(2) }}</strong></td>
                    <td>
                      <button class="icon-action" (click)="removeFromCart(item.product.id)" aria-label="Remove from cart" title="Remove from cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
                    </td>
                  </tr>
                }
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="text-align:right;font-weight:700;padding:12px 16px">Total</td>
                  <td style="font-family:var(--font-display);font-size:1.2rem;font-weight:700;color:var(--accent);padding:12px 16px">
                    €{{ total().toFixed(2) }}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            @if (error()) {
              <div class="alert alert-danger" style="margin-top:16px">{{ error() }}</div>
            }

            <div style="margin-top:16px;display:flex;gap:10px">
              <button class="btn btn-primary" (click)="submit()" [disabled]="submitting()">
                @if (submitting()) { <span class="spinner"></span> }
                Place Order
              </button>
              <a routerLink="/orders" class="btn btn-secondary">Cancel</a>
            </div>
          </div>
        }

      </div>
    </div>
  `,
  styles: [`
    .order-layout { max-width: 800px; }

    .product-picker-grid { display: flex; flex-direction: column; gap: 8px; max-height: 320px; overflow-y: auto; }
    .picker-card { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius); background: var(--bg); transition: border-color 0.15s; }
    .picker-card.in-cart { border-color: var(--accent); background: var(--accent-soft); }
    .picker-info { flex: 1; min-width: 0; }
    .picker-name { font-weight: 600; font-size: 0.9rem; }
    .picker-meta { display: flex; align-items: center; gap: 8px; margin-top: 2px; }

    .qty-control { display: flex; align-items: center; gap: 8px; }
    .qty-btn { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-strong); background: var(--surface); cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
    .qty-btn:hover { background: var(--accent); color: white; border-color: var(--accent); }
    .qty-val { font-weight: 700; min-width: 24px; text-align: center; }

    tfoot tr { border-top: 2px solid var(--border); }
  `]
})
export class OrderFormComponent implements OnInit {
  readonly auth=inject(AuthService); private producerSvc=inject(ProducerService); producers=signal<Producer[]>([]);producerFilter='';
  private ordersSvc  = inject(OrdersService);
  private productSvc = inject(ProductService);
  private fb         = inject(FormBuilder);
  private router     = inject(Router);

  products        = signal<Product[]>([]);
  loadingProducts = signal(true);
  cart            = signal<CartItem[]>([]);
  submitting      = signal(false);
  error           = signal('');

  customerForm = this.fb.group({
    customer_name:  [''],
    customer_email: ['', Validators.email],
    notes:          [''],
  });

  ngOnInit() {this.producerSvc.list().subscribe(r=>this.producers.set(r.data)); this.loadProducts();}
  loadProducts() {
    this.loadingProducts.set(true);
    this.productSvc.list({ active_only: true, limit: 100, business_id:this.producerFilter||undefined }).subscribe({
      next:  res => {
        
        this.products.set((res.data).data); this.loadingProducts.set(false); },
      error: ()  => this.loadingProducts.set(false),
    });
  }

  inCart(productId: string): boolean {
    return this.cart().some(i => i.product.id === productId);
  }

  cartQty(productId: string): number {
    return this.cart().find(i => i.product.id === productId)?.quantity ?? 0;
  }

  total(): number {
    return this.cart().reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  }

  addToCart(p: Product) {
    this.cart.update(c => [...c, { product: p, quantity: 1 }]);
  }

  removeFromCart(productId: string) {
    this.cart.update(c => c.filter(i => i.product.id !== productId));
  }

  changeQty(productId: string, delta: number) {
    this.cart.update(c => c.map(i => {
      if (i.product.id !== productId) return i;
      const q = i.quantity + delta;
      return q <= 0 ? null : { ...i, quantity: q };
    }).filter(Boolean) as CartItem[]);
  }

  submit() {
    if (this.customerForm.invalid) { this.customerForm.markAllAsTouched(); return; }
    if (this.cart().length === 0) { this.error.set('Add at least one product'); return; }
    this.submitting.set(true);
    this.error.set('');

    const f = this.customerForm.getRawValue();
    this.ordersSvc.create({
      customer_name:  [this.auth.currentUser()?.first_name,this.auth.currentUser()?.last_name].filter(Boolean).join(' '),
      customer_email: this.auth.currentUser()?.email,
      notes:          f.notes          || undefined,
      items: this.cart().map(i => ({ product_id: i.product.id, quantity: i.quantity })),
    }).subscribe({
      next:  res => {
        
        if (res.data.orders.length === 1) {
          this.router.navigate(['/orders', res.data.orders[0].id]);
        } else {
          this.router.navigate(['/orders']); // multiple businesses — go to list
        }
      },
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to place order'); this.submitting.set(false); },
    });
  }
}
