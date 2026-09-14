import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ProvenanceResponse } from '../../shared/models/product.models';

@Component({
  selector: 'app-public-trace',
  imports: [RouterLink],
  template: `
    <main class="trace-page">
      <section class="trace-card">
        <p class="eyebrow">LOCAL BITE · VERIFIED ORIGIN</p>
        @if (loading()) { <p>Loading product traceability…</p> }
        @else if (error()) { <h1>Product was not found</h1><p>{{ error() }}</p> }
        @else if (trace(); as data) {
          <h1>{{ data.product.name }}</h1>
          <p class="type">{{ data.product.product_type }} · {{ data.product.quantity }} {{ data.product.unit }}</p>
          @if (data.product.description) { <p>{{ data.product.description }}</p> }
          <div class="origin"><span>Producer</span><strong>{{ data.farm_name ?? 'Information unavailable' }}</strong></div>
          @if (data.batch) {
            <div class="origin"><span>Production batch</span><strong>{{ data.batch.name }} · {{ data.batch.process_type }}</strong></div>
            <div class="origin"><span>Materials</span><strong>{{ materialNames(data) || 'No materials recorded' }}</strong></div>
            <div class="origin"><span>Process</span><strong>{{ stepNames(data) || 'No steps recorded' }}</strong></div>
          }
          <a class="certificate" [href]="certificateUrl()" target="_blank" rel="noopener">Download certificate (PDF)</a>
          <p class="trace-id">Traceability ID: {{ data.product.qr_token }}</p>
        }
      </section>
    </main>
  `,
  styles: [`
    .trace-page{min-height:100dvh;display:grid;place-items:center;padding:20px;background:#f4f7f1;color:#203125;font-family:system-ui,sans-serif}
    .trace-card{width:min(100%,620px);background:#fff;padding:clamp(24px,6vw,48px);border-radius:20px;box-shadow:0 12px 38px #17301a18}
    .eyebrow{font-size:.75rem;letter-spacing:.12em;color:#58815c;font-weight:700}.type{color:#54705a;font-weight:600}.origin{display:grid;gap:4px;border-top:1px solid #e6ece4;padding:16px 0}.origin span,.trace-id{font-size:.8rem;color:#6c786e}.certificate{display:block;text-align:center;background:#2f6d42;color:#fff;text-decoration:none;border-radius:10px;padding:13px;margin:12px 0;font-weight:700}
  `],
})
export class PublicTraceComponent implements OnInit {
  private route = inject(ActivatedRoute); private products = inject(ProductService);
  trace = signal<ProvenanceResponse | null>(null); loading = signal(true); error = signal(''); qrToken = '';
  ngOnInit(): void { this.qrToken = this.route.snapshot.paramMap.get('qrToken') ?? ''; this.products.getPublicProvenance(this.qrToken).subscribe({ next: r => { this.trace.set(r.data); this.loading.set(false); }, error: () => { this.error.set('The QR code is invalid or the product is no longer public.'); this.loading.set(false); } }); }
  certificateUrl(): string { return this.products.publicCertificateUrl(this.qrToken); }
  materialNames(data: ProvenanceResponse): string { return data.batch?.raw_materials.map(m => m.name).join(', ') ?? ''; }
  stepNames(data: ProvenanceResponse): string { return data.batch?.steps.map(s => s.name).join(' → ') ?? ''; }
}
