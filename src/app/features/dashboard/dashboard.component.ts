import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { OrdersService } from '../../core/services/orders.service';
import { ProductService } from '../../core/services/product.service';
import { ProductionService } from '../../core/services/production.service';
import { RawMaterialsService } from '../../core/services/raw-materials.service';
import { RawMaterial } from '../../shared/models/raw-material.models';
import { Order } from '../../shared/models/order.models';
import { ApiResponse, PaginatedResponse } from '../../shared/models/api.models';
import { ProductionBatch } from '../../shared/models/production.models';
import { Product } from '../../shared/models/product.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  readonly auth = inject(AuthService);
  private rawMaterialsSvc = inject(RawMaterialsService);
  private ordersSvc = inject(OrdersService);
  private productionSvc = inject(ProductionService);
  private productSvc = inject(ProductService);

  loading = signal(true);
  error = signal(false);
  lowStockItems = signal<RawMaterial[]>([]);
  recentOrders = signal<Order[]>([]);
  activeBatches = signal<ProductionBatch[]>([]);
  plannedBatches = signal<ProductionBatch[]>([]);
  plannedCount = signal(0);
  stats = signal({ totalOrders: 0, revenue: 0, activeBatches: 0, totalProducts: 0 });
  get isWorker() { return this.auth.role() === 'Worker'; }
  get lowStockNames() { return this.lowStockItems().slice(0, 3).map(m => m.name).join(', '); }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set(false);
    const failed = () => { this.error.set(true); this.loading.set(false); };
    if (this.auth.isCustomer()) {
      const id = this.auth.id();
      if (!id) { failed(); return; }
      this.ordersSvc.getAllByUser(id, { limit: 5 }).subscribe({
        next: res => { this.recentOrders.set(res.data.data); this.loading.set(false); },
        error: failed,
      });
      return;
    }
    if (this.isWorker) {
      forkJoin({
        lowStock: this.rawMaterialsSvc.lowStock(),
        active: this.productionSvc.listBatches({ status: 'IN_PROGRESS', limit: 5 }),
        planned: this.productionSvc.listBatches({ status: 'PLANNED', limit: 5 }),
      }).subscribe({
        next: ({ lowStock, active, planned }) => {
          const activePage = active.data as unknown as PaginatedResponse<ProductionBatch>;
          const plannedPage = planned.data as unknown as PaginatedResponse<ProductionBatch>;
          this.lowStockItems.set((lowStock as unknown as ApiResponse<RawMaterial[]>).data);
          this.activeBatches.set(activePage.data);
          this.plannedBatches.set(plannedPage.data);
          this.plannedCount.set(plannedPage.total);
          this.stats.update(s => ({ ...s, activeBatches: activePage.total }));
          this.loading.set(false);
        },
        error: failed,
      });
      return;
    }
    forkJoin({
      lowStock: this.rawMaterialsSvc.lowStock(),
      analytics: this.ordersSvc.analytics(),
      batches: this.productionSvc.listBatches({ status: 'IN_PROGRESS', limit: 1 }),
      products: this.productSvc.listByFarm({ limit: 1 }),
    }).subscribe({
      next: ({ lowStock, analytics, batches, products }) => {
        this.lowStockItems.set((lowStock as unknown as ApiResponse<RawMaterial[]>).data);
        this.stats.set({
          totalOrders: analytics.data.total_orders,
          revenue: analytics.data.total_revenue,
          activeBatches: (batches.data as unknown as PaginatedResponse<ProductionBatch>).total,
          totalProducts: (products.data as unknown as PaginatedResponse<Product>).total,
        });
        this.loading.set(false);
      },
      error: failed,
    });
  }
}
