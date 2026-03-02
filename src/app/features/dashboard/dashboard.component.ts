import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { inject } from '@angular/core';import { OrdersService } from '../../core/services/orders.service';
import { ProductService } from '../../core/services/product.service';
import { ProductionService } from '../../core/services/production.service';
import { RawMaterialsService } from '../../core/services/raw-materials.service';
import { RawMaterial } from '../../shared/models/raw-material.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private rawMaterialsSvc = inject(RawMaterialsService);
  private ordersSvc       = inject(OrdersService);
  private productionSvc   = inject(ProductionService);
  private productSvc      = inject(ProductService);

  loading       = signal(true);
  lowStockItems = signal<RawMaterial[]>([]);
  stats         = signal({ totalOrders: 0, revenue: 0, activeBatches: 0, totalProducts: 0 });

  ngOnInit() {
    forkJoin({
      lowStock:    this.rawMaterialsSvc.lowStock(),
      analytics:   this.ordersSvc.analytics(),
      batches:     this.productionSvc.listBatches({ status: 'IN_PROGRESS', limit: 1 }),
      products:    this.productSvc.list({ limit: 1 }),
    }).subscribe({
      next: ({ lowStock, analytics, batches, products }) => {
        this.lowStockItems.set(lowStock);
        this.stats.set({
          totalOrders:   analytics.data.total_orders,
          revenue:       analytics.data.total_revenue,
          activeBatches: batches.total,
          totalProducts: products.total,
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
