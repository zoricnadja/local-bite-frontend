import { AuthenticatedMediaDirective } from '../../../core/auth/authenticated-media.directive';
import { CanDirective } from '../../../core/auth/can.directive';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import {Product, ProvenanceMaterial, ProvenanceResponse} from '../../../shared/models/product.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [AuthenticatedMediaDirective, CanDirective, CommonModule, RouterLink],
  template: `
    <div class="page">

      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (product()) {

        <div class="page-header">
          <div>
            <h1 class="page-title">{{ product()!.name }}</h1>
            <p class="page-subtitle">
              <span class="badge badge-planned">{{ product()!.product_type }}</span>
              &nbsp;
              <span [class]="product()!.is_active ? 'badge badge-completed' : 'badge badge-cancelled'">
                {{ product()!.status === 'PRODUCTION' ? 'Production' : product()!.status === 'ON_SALE' ? 'On sale' : 'Storage' }}
              </span>
            </p>
          </div>
          <div class="actions">
            @if(product()!.status !== 'PRODUCTION'){<button *appCan="'manageProducts'" class="btn btn-secondary" [disabled]="moving()" (click)="move()">Move to {{product()!.status === 'ON_SALE' ? 'Storage' : 'On sale'}}</button>}
            @else {<a [routerLink]="['/production',product()!.batch_id]" class="icon-action" aria-label="Edit in production" title="Edit in production"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5-13 13H3v-5L16 3ZM13 6l5 5"/></svg></a>}
            <a *appCan="'manageProducts'" [routerLink]="product()!.status === 'PRODUCTION' ? ['/production',product()!.batch_id] : ['/products', product()!.id, 'edit']" class="icon-action" aria-label="Edit" title="Edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5-13 13H3v-5L16 3ZM13 6l5 5"/></svg></a>
            <button *appCan="'deleteFarmData'" class="icon-action" [disabled]="product()!.status === 'PRODUCTION'" (click)="confirmDelete()" aria-label="Delete" title="Delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
          </div>
        </div>

        @if(moveError()){<div class="alert alert-danger">{{moveError()}}</div>}
        <div class="detail-layout">

          <!-- Left: image + QR -->
          <div class="detail-sidebar">
            <div class="card" style="padding:0;overflow:hidden">
              @if (product()!.image_path) {
                <img [authenticatedMedia]="imageUrl()" style="width:100%;aspect-ratio:1;object-fit:cover" [alt]="product()!.name" />
              } @else {
                <div class="image-placeholder">📦</div>
              }
              <div *appCan="'manageProducts'" style="padding:16px;display:flex;flex-direction:column;gap:10px">
                <label class="form-label">Product Image</label>
                <input type="file" accept="image/*" (change)="onImageSelect($event)" style="font-size:0.8rem" />
                @if (uploading()) {
                  <div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;color:var(--text-muted)">
                    <span class="spinner"></span> Uploading…
                  </div>
                }
              </div>
            </div>

            <!-- QR code -->
            <div class="card" style="margin-top:16px;text-align:center">
              <div class="form-label" style="margin-bottom:12px">QR Code</div>
              @if (product()!.qr_path) {
                <img [authenticatedMedia]="qrUrl()" style="width:160px;height:160px;border:1px solid var(--border);border-radius:8px" alt="QR" />
              } @else {
                <div style="color:var(--text-muted);font-size:0.875rem">No QR generated yet</div>
              }
              <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
                <a [routerLink]="['/trace', product()!.qr_token]" class="btn btn-sm btn-secondary">Open traceability</a>
                <a [authenticatedMedia]="qrUrl()" download class="btn btn-sm btn-secondary">⬇ Download</a>
                <button *appCan="'deleteFarmData'" class="btn btn-sm btn-ghost" (click)="regenerateQr()">🔄 Regenerate</button>
              </div>
            </div>
          </div>

          <!-- Right: info + provenance -->
          <div class="detail-main">

            <!-- Product info -->
            <div class="card">
              <h3 style="margin-bottom:16px">Product Details</h3>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Price</div>
                  <div class="info-value" style="color:var(--accent);font-family:var(--font-display);font-size:1.4rem">€{{ product()!.price }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Stock</div>
                  <div class="info-value">{{ product()!.quantity }} {{ product()!.unit }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Created</div>
                  <div class="info-value text-muted text-sm">{{ product()!.created_at | date:'mediumDate' }}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Updated</div>
                  <div class="info-value text-muted text-sm">{{ product()!.updated_at | date:'mediumDate' }}</div>
                </div>
              </div>
              @if (product()!.description) {
                <div style="margin-top:16px">
                  <div class="info-label">Description</div>
                  <p style="margin-top:6px;color:var(--text-secondary);font-size:0.9rem;line-height:1.6">{{ product()!.description }}</p>
                </div>
              }
            </div>

            <!-- Provenance chain -->
            @if (loadingProvenance()) {
              <div class="card" style="margin-top:16px;text-align:center;padding:32px">
                <span class="spinner"></span>
              </div>
            } @else if (provenance()) {
              <div class="card" style="margin-top:16px">
                <h3 style="margin-bottom:16px">🌿 Provenance Chain</h3><div class="provenance-step"><div><div class="provenance-title">Product expiry</div><div>{{ product()!.expiry_date ? (product()!.expiry_date | date:'mediumDate') : 'Not recorded' }}</div></div></div>

                @if (provenance()!.farm_name) {
                  <div class="provenance-step">
                    <div class="provenance-icon">🏡</div>
                    <div>
                      <div class="provenance-title">Farm</div>
                      <div class="provenance-detail">{{ provenance()!.farm_name }}</div>
                    </div>
                  </div>
                }

                @if (provenance()!.batch) {
                  <div class="provenance-step">
                    <div class="provenance-icon">⚙️</div>
                    <div>
                      <div class="provenance-title">Production Batch: {{ provenance()!.batch!.name }}</div>
                      <div class="provenance-detail">
                        {{ provenance()!.batch!.process_type }} ·
                        <span [class]="'badge badge-' + provenance()!.batch!.status.toLowerCase()">{{ provenance()!.batch!.status }}</span>
                        @if (provenance()!.batch!.start_date) {
                          · {{ provenance()!.batch!.start_date }} → {{ provenance()!.batch!.end_date ?? 'ongoing' }}
                        }
                      </div>
                    </div>
                  </div>

                  @if (provenance()!.batch!.raw_materials.length > 0) {
                    <div class="provenance-step">
                      <div class="provenance-icon">🌾</div>
                      <div style="flex:1">
                        <div class="provenance-title">Raw Materials</div>
                        <div class="materials-list">
                          @for (m of provenance()!.batch!.raw_materials; track m.id) {
                            <div class="material-record"><strong>{{ m.name }} · {{ m.quantity_used }} {{ m.unit }}</strong><div>Origin: {{ m.origin || 'Not recorded' }} · Supplier: {{ m.supplier || 'Not recorded' }}</div><div>Received: {{ m.received_date ? (m.received_date | date:'mediumDate') : 'Not recorded' }} · Expiry: {{ m.expiry_date ? (m.expiry_date | date:'mediumDate') : 'Not recorded' }}</div></div>
                          }
                        </div>
                      </div>
                    </div>
                  }

                  @if (provenance()!.batch!.steps.length > 0) {
                    <div class="provenance-step">
                      <div class="provenance-icon">📋</div>
                      <div style="flex:1">
                        <div class="provenance-title">Process Steps</div>
                        <div class="steps-list">
                          @for (s of provenance()!.batch!.steps; track s.id) {
                            <div class="step-item">
                              <span class="step-num">{{ s.step_order }}</span>
                              <span class="step-name">{{ s.name }}</span>
                              @if (s.duration_hours) {
                                <span class="step-meta">{{ s.duration_hours }}h</span>
                              }
                              @if (s.temperature) {
                                <span class="step-meta">{{ s.temperature }}°C</span>
                              }
                            </div>
                          }
                        </div>
                      </div>
                    </div>
                  }
                } @else {
                  <p class="text-muted text-sm">No production batch linked to this product.</p>
                }
              </div>
            }

          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-layout { display: grid; grid-template-columns: 280px 1fr; gap: 24px; align-items: start; }
    @media (max-width: 768px) { .detail-layout { grid-template-columns: 1fr; } }

    .image-placeholder { height: 200px; display: flex; align-items: center; justify-content: center; font-size: 4rem; background: var(--surface-2); }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px; }
    .info-value { font-size: 0.95rem; font-weight: 600; }

    .provenance-step { display: flex; gap: 14px; align-items: flex-start; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .provenance-step:last-child { border-bottom: none; }
    .provenance-icon { font-size: 1.4rem; width: 32px; text-align: center; flex-shrink: 0; margin-top: 2px; }
    .provenance-title { font-weight: 700; font-size: 0.9rem; margin-bottom: 4px; }
    .provenance-detail { font-size: 0.85rem; color: var(--text-secondary); }

    .material-record { width:100%; padding:12px; border-radius:8px; background:var(--surface-2); line-height:1.7; font-size:.85rem; }
    .materials-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .material-chip { background: var(--accent-soft); color: var(--accent); font-size: 0.75rem; font-weight: 600; padding: 3px 10px; border-radius: 100px; }

    .steps-list { display: flex; flex-direction: column; gap: 6px; margin-top: 8px; }
    .step-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; }
    .step-num { background: var(--surface-2); border: 1px solid var(--border); border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700; flex-shrink: 0; }
    .step-name { font-weight: 600; }
    .step-meta { color: var(--text-muted); font-size: 0.8rem; }
  `]
})
export class ProductDetailComponent implements OnInit {
  moving=signal(false); moveError=signal('');
  move(){this.moving.set(true);this.moveError.set('');this.svc.update(this.product()!.id,{status:this.product()!.status === 'ON_SALE' ? 'STORAGE' : 'ON_SALE'}).subscribe({next:r=>{this.product.set(r.data);this.moving.set(false);},error:e=>{this.moveError.set(e.error?.error??'Could not move product');this.moving.set(false);}});}

  private svc    = inject(ProductService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  product          = signal<Product | null>(null);
  provenance       = signal<ProvenanceResponse | null>(null);
  loading          = signal(true);
  loadingProvenance = signal(true);
  uploading        = signal(false);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;

    this.svc.getById(id).subscribe({
      next: res => {
        
        this.product.set(res.data);
        this.loading.set(false);
        this.loadProvenance(id);
      },
      error: () => this.loading.set(false),
    });
  }

  loadProvenance(id: string) {
    this.svc.getProvenance(id).subscribe({
      next:  res => { this.provenance.set(res.data); this.loadingProvenance.set(false); },
      error: ()  => this.loadingProvenance.set(false),
    });
  }

  imageUrl(): string {
    return this.svc.imageUrl(this.product()!.id);
  }

  qrUrl(): string {
    return this.svc.qrUrl(this.product()!.id);
  }

  onImageSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.svc.uploadImage(this.product()!.id, file).subscribe({
      next: res => {  this.product.set(res.data); this.uploading.set(false); },
      error: () => this.uploading.set(false),
    });
  }

  regenerateQr() {
    this.svc.regenerateQr(this.product()!.id).subscribe(res => {  this.product.set(res.data) }) ;
  }

  confirmDelete() {
    if (!confirm('Delete "' + this.product()!.name + '"? This cannot be undone.')) return;
    this.svc.delete(this.product()!.id).subscribe(() => this.router.navigate(['/products']));
  }
}
