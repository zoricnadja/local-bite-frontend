import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';import { RawMaterialsService } from '../../../core/services/raw-materials.service';
import { RawMaterial } from '../../../shared/models/raw-material.models';

@Component({
  selector: 'app-raw-materials-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './raw-materials.component.html',
  styleUrls: ['./raw-materials.component.css'],
})
export class RawMaterialsListComponent implements OnInit {
  private svc = inject(RawMaterialsService);

  items        = signal<RawMaterial[]>([]);
  loading      = signal(true);
  total        = signal(0);
  page         = signal(1);
  lowStockCount = signal(0);

  search      = '';
  typeFilter  = '';
  showLowOnly = false;
  pageSize    = 20;

  private searchTimer: any;

  totalPages = () => Math.ceil(this.total() / this.pageSize);
  isLow = (m: RawMaterial) => m.low_stock_threshold != null && +m.quantity <= +m.low_stock_threshold;

  ngOnInit() {
    this.load();
    this.svc.lowStock().subscribe(items => this.lowStockCount.set(items.length));
  }

  load() {
    this.loading.set(true);
    this.svc.list({
      page: this.page(),
      limit: this.pageSize,
      search: this.search || undefined,
      material_type: this.typeFilter || undefined,
    }).subscribe(res => {
      let data = res.data;
      if (this.showLowOnly) data = data.filter((m: RawMaterial) => this.isLow(m));
      this.items.set(data);
      this.total.set(res.total);
      this.loading.set(false);
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page.set(1); this.load(); }, 300);
  }

  setPage(p: number) { this.page.set(p); this.load(); }

  confirmDelete(m: RawMaterial) {
    if (!confirm(`Delete "${m.name}"?`)) return;
    this.svc.delete(m.id).subscribe(() => this.load());
  }
}