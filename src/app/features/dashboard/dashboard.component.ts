import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/auth/auth.service';
import { RawMaterial } from '../../shared/models/raw-material.models';
import { Order } from '../../shared/models/order.models';
import { ApiResponse } from '../../shared/models/api.models';
import { ProductionBatch } from '../../shared/models/production.models';

interface DashboardQuery {
  lowStockItems?: RawMaterial[];
  recentOrders?: Order[];
  activeBatches?: ProductionBatch[];
  plannedBatches?: ProductionBatch[];
  plannedCount?: number;
  stats?: { totalOrders: number; revenue: number; activeBatches: number; totalProducts: number };
  asOf: string | null;
}

@Component({
  selector: 'app-dashboard', standalone: true,
  imports: [CommonModule, RouterLink], templateUrl: './dashboard.component.html', styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private http = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  loading = signal(true);
  error = signal(false);
  lowStockItems = signal<RawMaterial[]>([]);
  recentOrders = signal<Order[]>([]);
  activeBatches = signal<ProductionBatch[]>([]);
  plannedBatches = signal<ProductionBatch[]>([]);
  plannedCount = signal(0);
  stats = signal({ totalOrders: 0, revenue: 0, activeBatches: 0, totalProducts: 0 });
  asOf = signal<string | null>(null);
  private requesting = false;
  get isWorker() { return this.auth.role() === 'Worker'; }
  get lowStockNames() { return this.lowStockItems().slice(0, 3).map(m => m.name).join(', '); }
  get needsBusiness() { return ['Worker','BusinessOwner'].includes(this.auth.role() ?? '') && !this.auth.businessId(); }

  ngOnInit() {
    this.load();
    interval(5000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load(false));
  }

  load(showLoading = true) {
    if (this.needsBusiness) { this.loading.set(false); return; }
    if (this.requesting) return;
    this.requesting = true;
    if (showLoading) this.loading.set(true);
    this.http.get<ApiResponse<DashboardQuery>>('/api/queries/dashboard').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ data }) => {
        this.lowStockItems.set(data.lowStockItems ?? []);
        this.recentOrders.set(data.recentOrders ?? []);
        this.activeBatches.set(data.activeBatches ?? []);
        this.plannedBatches.set(data.plannedBatches ?? []);
        this.plannedCount.set(data.plannedCount ?? 0);
        if (data.stats) this.stats.set(data.stats);
        this.asOf.set(data.asOf);
        this.error.set(false); this.loading.set(false); this.requesting = false;
      },
      error: () => { this.error.set(true); this.loading.set(false); this.requesting = false; },
    });
  }
}
