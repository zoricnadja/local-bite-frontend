import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../shared/models/product.models';
import {PaginatedResponse} from "../../../shared/models/api.models";

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">{{ total() }} products listed</p>
        </div>
        <a routerLink="new" class="btn btn-primary">+ Add Product</a>
      </div>

      <div class="search-bar">
        <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()"
               placeholder="Search products..." style="flex:1;min-width:200px" />
        <select class="form-control" style="width:auto" [(ngModel)]="typeFilter" (ngModelChange)="load()">
          <option value="">All types</option>
          <option value="meat">Meat</option>
          <option value="dairy">Dairy</option>
          <option value="vegetable">Vegetable</option>
          <option value="fruit">Fruit</option>
          <option value="cheese">Cheese</option>
          <option value="sausage">Sausage</option>
          <option value="honey">Honey</option>
          <option value="other">Other</option>
        </select>
        <label class="toggle-label">
          <input type="checkbox" [(ngModel)]="activeOnly" (ngModelChange)="load()" />
          Active only
        </label>
      </div>

      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-text">No products found</div>
          <a routerLink="new" class="btn btn-primary" style="margin-top:16px">Add your first product</a>
        </div>
      } @else {
        <div class="product-grid">
          @for (p of items(); track p.id) {
            <div class="product-card" [class.inactive]="!p.is_active">
              <div class="product-image">
                @if (p.image_path) {
                  <img [src]="imageUrl(p)" [alt]="p.name" />
                } @else {
                  <div class="product-image-placeholder">📦</div>
                }
                <span class="product-type-badge">{{ p.product_type }}</span>
                @if (!p.is_active) {
                  <span class="inactive-overlay">Inactive</span>
                }
              </div>
              <div class="product-body">
                <div class="product-name">{{ p.name }}</div>
                @if (p.description) {
                  <div class="product-desc">{{ p.description }}</div>
                }
                <div class="product-meta">
                  <span class="product-price">€{{ p.price }}</span>
                  <span class="product-qty">{{ p.quantity }} {{ p.unit }}</span>
                </div>
              </div>
              <div class="product-actions">
                <a [routerLink]="p.id" class="btn btn-sm btn-secondary" style="flex:1;justify-content:center">View</a>
                <a [routerLink]="[p.id, 'edit']" class="btn btn-sm btn-ghost" title="Edit">✏️</a>
                <button class="btn btn-sm btn-ghost" (click)="confirmDelete(p)" title="Delete">🗑️</button>
              </div>
            </div>
          }
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
    .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px; }
    .product-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); overflow: hidden; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; transition: box-shadow 0.15s, transform 0.15s; }
    .product-card:hover { box-shadow: var(--shadow); transform: translateY(-2px); }
    .product-card.inactive { opacity: 0.6; }
    .product-image { height: 160px; background: var(--surface-2); position: relative; overflow: hidden; }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .product-image-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--text-muted); }
    .product-type-badge { position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,0.6); color: white; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 100px; }
    .inactive-overlay { position: absolute; top: 10px; right: 10px; background: var(--danger); color: white; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 3px 8px; border-radius: 100px; }
    .product-body { padding: 14px 16px; flex: 1; }
    .product-name { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
    .product-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .product-meta { display: flex; justify-content: space-between; align-items: center; }
    .product-price { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--accent); }
    .product-qty { font-size: 0.8rem; color: var(--text-muted); }
    .product-actions { padding: 10px 12px; border-top: 1px solid var(--border); display: flex; gap: 6px; align-items: center; }
    .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; color: var(--text-secondary); cursor: pointer; white-space: nowrap; }
    .pagination { display: flex; align-items: center; gap: 12px; margin-top: 24px; justify-content: center; }
    .page-info { font-size: 0.875rem; color: var(--text-muted); }
  `]
})
export class ProductsListComponent implements OnInit {
  private svc = inject(ProductService);

  items    = signal<Product[]>([]);
  loading  = signal(true);
  total    = signal(0);
  page     = signal(1);
  pageSize = 20;

  search     = '';
  typeFilter = '';
  activeOnly = false;

  private searchTimer: any;
  totalPages = () => Math.ceil(this.total() / this.pageSize);

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.svc.list({
      page:         this.page(),
      limit:        this.pageSize,
      search:       this.search       || undefined,
      product_type: this.typeFilter   || undefined,
      active_only:  this.activeOnly   || undefined,
    }).subscribe({
      next:  res => {
        let data = res.data as unknown as PaginatedResponse<Product>
        this.items.set(data.data);
        this.total.set(data.total);
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

  imageUrl(p: Product): string {
    return this.svc.imageUrl(p!.id);
  }

  confirmDelete(p: Product) {
    if (!confirm('Delete "' + p.name + '"?')) return;
    this.svc.delete(p.id).subscribe(() => this.load());
  }
}
