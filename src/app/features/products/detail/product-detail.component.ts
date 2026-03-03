import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import {Product, ProvenanceMaterial, ProvenanceResponse} from '../../../shared/models/product.models';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
                {{ product()!.is_active ? 'Active' : 'Inactive' }}
              </span>
            </p>
          </div>
          <div class="actions">
            <a [routerLink]="['/products', product()!.id, 'edit']" class="btn btn-secondary">✏️ Edit</a>
            <button class="btn btn-danger" (click)="confirmDelete()">🗑️ Delete</button>
          </div>
        </div>

        <div class="detail-layout">

          <!-- Left: image + QR -->
          <div class="detail-sidebar">
            <div class="card" style="padding:0;overflow:hidden">
              @if (product()!.image_path) {
                <img [src]="imageUrl()" style="width:100%;aspect-ratio:1;object-fit:cover" [alt]="product()!.name" />
              } @else {
                <div class="image-placeholder">📦</div>
              }
              <div style="padding:16px;display:flex;flex-direction:column;gap:10px">
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
                <img [src]="qrUrl()" style="width:160px;height:160px;border:1px solid var(--border);border-radius:8px" alt="QR" />
              } @else {
                <div style="color:var(--text-muted);font-size:0.875rem">No QR generated yet</div>
              }
              <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
                <a [href]="qrUrl()" download class="btn btn-sm btn-secondary">⬇ Download</a>
                <button class="btn btn-sm btn-ghost" (click)="regenerateQr()">🔄 Regenerate</button>
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
                <h3 style="margin-bottom:16px">🌿 Provenance Chain</h3>

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
                        <span class="badge badge-completed">{{ provenance()!.batch!.status }}</span>
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
                            <span class="material-chip">{{ m.name }} · {{ m.quantity_used }} {{ m.unit }}</span>
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
        console.log(res)
        this.product.set(res.data as unknown as Product);
        this.loading.set(false);
        this.loadProvenance(id);
      },
      error: () => this.loading.set(false),
    });
  }

  loadProvenance(id: string) {
    this.svc.getProvenance(id).subscribe({
      next:  res => { this.provenance.set(res.data as unknown as ProvenanceResponse); this.loadingProvenance.set(false); },
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
      next: res => { console.log(res); this.product.set(res.data as unknown as Product); this.uploading.set(false); },
      error: () => this.uploading.set(false),
    });
  }

  regenerateQr() {
    this.svc.regenerateQr(this.product()!.id).subscribe(res => { console.log(res); this.product.set(res.data as unknown as Product) }) ;
  }

  confirmDelete() {
    if (!confirm('Delete "' + this.product()!.name + '"? This cannot be undone.')) return;
    this.svc.delete(this.product()!.id).subscribe(() => this.router.navigate(['/products']));
  }
}
