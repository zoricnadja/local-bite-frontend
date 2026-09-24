import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { PublicProvenanceResponse } from '../../shared/models/product.models';
import { retry, timer, throwError } from 'rxjs';

@Component({
  selector: 'app-public-trace',
  imports: [DatePipe, TitleCasePipe],
  template: `
    <main class="trace-page">
      <section class="trace-card">
        <p class="eyebrow">LOCAL BITE · FROM FARM TO TABLE</p>
        @if (loading()) { <p>Loading product traceability…</p> }
        @else if (error()) { <h1>Traceability unavailable</h1><p>{{ error() }}</p><button class="btn" (click)="load()">Try again</button> }
        @else if (trace(); as data) {
          <h1>{{ data.product.name }}</h1>
          <p class="type">{{ data.product.product_type }}</p>
          @if (data.product.description) { <p>{{ data.product.description }}</p> }
          <div class="origin"><span>Producer</span><strong>{{ data.farm_name ?? 'Information unavailable' }}</strong></div>
          <div class="origin"><span>Product expiry date</span><strong>{{ data.product.expiry_date ? (data.product.expiry_date | date:'longDate') : 'Not recorded' }}</strong></div>
          @if (data.batch) {
            <h2>Production journey</h2>
            <div class="origin"><span>Production batch</span><strong>{{ data.batch.name }}</strong></div>
            <div class="dates"><div class="origin"><span>Production start</span><strong>{{ data.batch.start_date ? (data.batch.start_date | date:'longDate') : 'Not recorded' }}</strong></div><div class="origin"><span>Production end</span><strong>{{ data.batch.end_date ? (data.batch.end_date | date:'longDate') : 'Not recorded' }}</strong></div></div>
            <p class="status" [class.cancelled]="data.batch.status === 'CANCELLED'">{{ data.batch.status.replace('_', ' ') | titlecase }}</p>
            <h2>Raw materials used</h2>
            @for (material of data.batch.raw_materials; track $index) {
              <article class="material"><h3>{{ material.name }}</h3><dl><div><dt>Origin</dt><dd>{{ material.origin || 'Not recorded' }}</dd></div><div><dt>Harvest / production date</dt><dd>{{ material.harvest_date ? (material.harvest_date | date:'mediumDate') : 'Not recorded' }}</dd></div></dl></article>
            } @empty { <p>No raw materials recorded for this batch.</p> }
          } @else { <p>Production information is temporarily unavailable. Please try again later.</p> }
          <a class="certificate btn" [href]="certificateUrl()" target="_blank" rel="noopener">Download traceability record (PDF)</a>
          <p class="trace-id">Traceability ID: {{ data.product.qr_token }}</p>
        }
      </section>
    </main>
  `,
  styles: [`
    .trace-page{min-height:100dvh;display:grid;place-items:center;padding:20px;background:#f4f7f1;color:#203125;font-family:system-ui,sans-serif}
    .trace-card{width:min(100%,620px);background:#fff;padding:clamp(24px,6vw,48px);border-radius:20px;box-shadow:0 12px 38px #17301a18}
    h1{font-size:2.3rem;margin:12px 0}h2{font-size:1.2rem;margin:28px 0 14px}h3{margin:0}li{padding:6px 0}.dates,dl{display:grid;grid-template-columns:1fr 1fr;gap:16px}.material{background:#f4f7f1;border:1px solid #e0e8dc;border-radius:12px;padding:18px;margin:12px 0}.material p{margin:5px 0;color:#54705a}dl{margin:14px 0 0}dt{font-size:.8rem;color:#6c786e}dd{margin:4px 0;overflow-wrap:anywhere}.status{display:inline-block;border-radius:20px;background:#e7ece6;color:#3c5041;padding:5px 12px;font-size:.85rem}.status.cancelled{background:#f9e4e4;color:#952c2c}.trace-id{overflow-wrap:anywhere}@media(max-width:420px){dl,.dates{grid-template-columns:1fr}}
    .eyebrow{font-size:.75rem;letter-spacing:.12em;color:#58815c;font-weight:700}.type{color:#54705a;font-weight:600}.origin{display:grid;gap:4px;border-top:1px solid #e6ece4;padding:16px 0}.origin span,.trace-id{font-size:.8rem;color:#6c786e}.certificate{display:block;text-align:center;background:#2f6d42;color:#fff;text-decoration:none;border-radius:10px;padding:13px;margin:12px 0;font-weight:700}
  `],
})
export class PublicTraceComponent implements OnInit {
  private route = inject(ActivatedRoute); private products = inject(ProductService);
  trace = signal<PublicProvenanceResponse | null>(null); loading = signal(true); error = signal(''); qrToken = '';
  ngOnInit(): void { this.qrToken = this.route.snapshot.paramMap.get('qrToken') ?? ''; this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.products.getPublicProvenance(this.qrToken).pipe(retry({ count: 4, delay: error => error.status === 409 ? timer(1000) : throwError(() => error) })).subscribe({
      next: response => { this.trace.set(response.data); this.loading.set(false); },
      error: error => { this.error.set(error.status === 404 ? 'The QR code is invalid or the product is no longer public.' : 'Product information is being updated or is temporarily unavailable. Please try again shortly.'); this.loading.set(false); },
    });
  }
  certificateUrl(): string { return this.products.publicCertificateUrl(this.qrToken); }
  materialNames(data: PublicProvenanceResponse): string { return data.batch?.raw_materials.map(m => m.name).join(', ') ?? ''; }
  stepNames(data: PublicProvenanceResponse): string { return data.batch?.steps.map(s => s.name).join(' → ') ?? ''; }
}
