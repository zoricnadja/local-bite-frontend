import { PRODUCT_TYPES, LEGACY_PRODUCT_TYPES } from '../../../shared/models/product-types';
import { AuthenticatedMediaDirective } from '../../../core/auth/authenticated-media.directive';
import { ActivatedRoute } from '@angular/router';
import { ProducerService, Producer } from '../../../core/services/producer.service';
import { DestroyRef } from '@angular/core';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CanDirective } from '../../../core/auth/can.directive';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, ProductStatus } from '../../../shared/models/product.models';
import {PaginatedResponse} from "../../../shared/models/api.models";
import {AuthService} from "../../../core/auth/auth.service";

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [AuthenticatedMediaDirective, CanDirective, CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">Products</h1>
          <p class="page-subtitle">{{ total() }} products</p>
        </div>
      </div>

      @if(actionError()){<div class="alert alert-danger" role="alert">{{actionError()}}</div>}
      <div class="search-bar">
        @if(!authSvc.isCustomer()){<select class="form-control" style="width:auto" aria-label="Product state" [(ngModel)]="stateFilter" (ngModelChange)="setPage(1)"><option value="">All states</option><option value="PRODUCTION">Production</option><option value="STORAGE">Storage</option><option value="ON_SALE">On sale</option></select>}
        <input class="search-input" [(ngModel)]="search" (ngModelChange)="onSearch()"
               placeholder="Search products..." style="flex:1;min-width:200px" />
        <select class="form-control" style="width:auto" [(ngModel)]="typeFilter" (ngModelChange)="setPage(1)">
          <option value="">All types</option>
          @for (type of productTypes; track type.value) {
                  <option [value]="type.value">{{ type.label }}</option>
                }
        </select>
        @if (authSvc.isCustomer()) {<select class="form-control" aria-label="Producer" style="width:auto" [(ngModel)]="producerFilter" (ngModelChange)="setPage(1)"><option value="">All producers</option>@for(p of producers(); track p.id){<option [value]="p.id">{{p.name}}</option>}</select>}
      </div>

      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (items().length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">📦</div>
          <div class="empty-state-text">No products found</div>
          <p *appCan="'manageProduction'" class="text-muted">Completed production appears in Storage. Edit its price and place it on sale when ready.</p>
        </div>
      } @else {
        <div class="product-grid">
          @for (p of items(); track p.id) {
            <div class="product-card clickable-surface" [routerLink]="['/products', p.id]" #detailLink role="link" tabindex="0"
                 (keydown.enter)="$event.target === $event.currentTarget && detailLink.click()"
                 [attr.aria-label]="'Open product ' + p.name">
              <div class="product-image">
                @if (p.image_path) {
                  <img [authenticatedMedia]="imageUrl(p)" [alt]="p.name" />
                } @else {
                  <div class="product-image-placeholder">📦</div>
                }
                <span class="product-type-badge">{{ p.product_type }}</span>
                <span class="state-label" [attr.data-state]="p.status">{{stateLabel(p)}}</span>
              </div>
              <div class="product-body">
                <div class="product-name">{{ p.name }}</div>@if(authSvc.isCustomer()){<p class="text-muted text-sm">{{producerName(p.business_id)}}</p>}
                @if (p.description) {
                  <div class="product-desc">{{ p.description }}</div>
                }
                <div class="product-meta">
                  <span class="product-price">€{{ p.price }}</span>
                  <span class="product-qty">{{ p.quantity }} {{ p.unit }}</span>
                </div>
              </div>
              <div class="product-actions" (click)="$event.stopPropagation()">
                @if(p.status !== 'PRODUCTION'){<button *appCan="'manageProducts'" class="btn btn-sm btn-secondary" [disabled]="moving() === p.id" (click)="move(p)">Move to {{p.status === 'ON_SALE' ? 'Storage' : 'On sale'}}</button>}
                <a *appCan="'manageProducts'" [routerLink]="p.status === 'PRODUCTION' ? ['/production',p.batch_id] : ['/products',p.id, 'edit']" class="icon-action" aria-label="Edit" title="Edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5-13 13H3v-5L16 3ZM13 6l5 5"/></svg></a>
                <button *appCan="'deleteBusinessData'" class="icon-action" [disabled]="p.status === 'PRODUCTION'" (click)="confirmDelete(p)" title="Delete" aria-label="Delete product"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
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
    .state-label { position:absolute; top:10px; right:10px; padding:4px 8px; border-radius:6px; background:#235c3a; color:white; font-size:.75rem; font-weight:700; }
    .state-label[data-state="PRODUCTION"] { background:#854d0e; }
    .state-label[data-state="STORAGE"] { background:#1e40af; }
    .product-image { height: 160px; background: var(--surface-2); position: relative; overflow: hidden; }
    .product-image img { width: 100%; height: 100%; object-fit: cover; }
    .product-image-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: var(--text-muted); }
    .product-type-badge { position: absolute; top: 10px; left: 10px; background: #24332b; color: white; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 100px; }
    .product-body { padding: 14px 16px; flex: 1; }
    .product-name { font-weight: 700; font-size: 1rem; margin-bottom: 4px; }
    .product-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .product-meta { display: flex; justify-content: space-between; align-items: center; }
    .product-price { font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; color: var(--accent); }
    .product-qty { font-size: 0.8rem; color: var(--text-muted); }
    .product-actions:empty { display: none; }
    .product-actions { padding: 10px 12px; border-top: 1px solid var(--border); display: flex; flex-wrap:wrap; gap: 8px; align-items: center; }
    .pagination { display: flex; align-items: center; gap: 12px; margin-top: 24px; justify-content: center; }
    .page-info { font-size: 0.875rem; color: var(--text-muted); }
  `]
})
export class ProductsListComponent implements OnInit {
  readonly productTypes = [...PRODUCT_TYPES, ...LEGACY_PRODUCT_TYPES];
  private svc = inject(ProductService);
  readonly authSvc = inject(AuthService);

  private route=inject(ActivatedRoute); private producerSvc=inject(ProducerService); private destroyRef=inject(DestroyRef);
  stateFilter: ProductStatus | ''=''; moving=signal(''); actionError=signal('');
  stateLabel(p:Product){return p.status === 'PRODUCTION' ? 'Production' : p.status === 'ON_SALE' ? 'On sale' : 'Storage';}
  move(p:Product){this.moving.set(p.id);this.actionError.set('');this.svc.update(p.id,{status:p.status === 'ON_SALE' ? 'STORAGE' : 'ON_SALE'}).subscribe({next:()=>{this.moving.set('');this.load();},error:e=>{this.moving.set('');this.actionError.set(e.error?.error??'Could not move product');}});}
  producers=signal<Producer[]>([]);producerFilter='';
  producerName(id:string){return this.producers().find(p=>p.id===id)?.name??'Producer';}
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

  ngOnInit() { this.load();this.producerSvc.list().subscribe(r=>this.producers.set(r.data));if(!this.authSvc.isCustomer()) interval(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>this.load(true)); }

  load(background = false) {
    if (!background) this.loading.set(true);
    
    if (this.authSvc.isCustomer() || this.authSvc.role() === 'SystemAdmin'){
      this.svc.list({
        page: this.page(),
        limit: this.pageSize,
        search: this.search || undefined,
        product_type: this.typeFilter || undefined,
        is_active: this.authSvc.isCustomer() ? true : undefined,
        status: this.authSvc.isCustomer() ? 'ON_SALE' : this.stateFilter || undefined,
        business_id: this.producerFilter || undefined,
      }).subscribe({
        next: res => {
          let data = res.data
          this.items.set(data.data);
          this.total.set(data.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
    else {
      this.svc.listByBusiness({
        page: this.page(),
        limit: this.pageSize,
        search: this.search || undefined,
        product_type: this.typeFilter || undefined,
        is_active: this.authSvc.isCustomer() ? true : undefined,
        status: this.authSvc.isCustomer() ? 'ON_SALE' : this.stateFilter || undefined,
        business_id: this.producerFilter || undefined,
      }).subscribe({
        next: res => {
          let data = res.data
          this.items.set(data.data);
          this.total.set(data.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
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
