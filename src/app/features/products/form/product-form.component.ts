import { requiredText } from '../../../shared/form-validators';
import { FieldErrorsDirective } from '../../../shared/field-errors.directive';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductionService } from '../../../core/services/production.service';
import { ProductionBatch } from '../../../shared/models/production.models';
import { PaginatedResponse } from '../../../shared/models/api.models';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [FieldErrorsDirective, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ isEdit() ? 'Edit' : 'Add' }} Product</h1>
        </div>
        <a routerLink="/products" class="btn btn-secondary">← Back</a>
      </div>

      <div class="card" style="max-width:720px">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">

            <div class="form-group form-full">
              <label class="form-label">Name *</label>
              <input class="form-control" formControlName="name" placeholder="e.g. Domaći sir" />
            </div>

            <div class="form-group">
              <label class="form-label">Type *</label>
              <select class="form-control" formControlName="product_type">
                <option value="">Select type…</option>
                <option value="meat">Meat</option>
                <option value="dairy">Dairy</option>
                <option value="vegetable">Vegetable</option>
                <option value="fruit">Fruit</option>
                <option value="cheese">Cheese</option>
                <option value="sausage">Sausage</option>
                <option value="honey">Honey</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Price (€) *</label>
              <input class="form-control" type="number" formControlName="price" min="0" step="0.01" />
            </div>

            <div class="form-group">
              <label class="form-label">Quantity *</label>
              <input class="form-control" type="number" formControlName="quantity" min="0" step="0.001" />
            </div>

            <div class="form-group">
              <label class="form-label">Unit *</label>
              <select class="form-control" formControlName="unit">
                <option value="kg">kg</option>
                <option value="g">g</option>
                <option value="l">l</option>
                <option value="ml">ml</option>
                <option value="pcs">pcs</option>
                <option value="jar">jar</option>
                <option value="box">box</option>
              </select>
            </div>

            <div class="form-group form-full">
              <label class="form-label">Description</label>
              <textarea class="form-control" formControlName="description" placeholder="Describe your product…"></textarea>
            </div>

            <div class="form-group"><label class="form-label">Product expiry date</label><input class="form-control" type="date" formControlName="expiry_date" /></div>
            <div class="form-group"><label class="form-label">Production batch</label><select class="form-control" formControlName="batch_id"><option value="">No linked production</option>@for (batch of batches(); track batch.id) {<option [value]="batch.id">{{ batch.name }} · {{ batch.status }}</option>}</select><small>Links the product to its production dates and material origins.</small></div>
            @if (isEdit()) {
              <div class="form-group" style="display:flex;align-items:center;gap:10px">
                <input type="checkbox" formControlName="is_active" id="is_active" />
                <label for="is_active" style="font-size:0.9rem;cursor:pointer">On sale (visible to customers)</label>
              </div>
            }

          </div>

          @if (error()) {
            <div class="alert alert-danger" style="margin-top:16px">{{ error() }}</div>
          }

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-primary" type="submit" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> }
              {{ isEdit() ? 'Save changes' : 'Create product' }}
            </button>
            <a routerLink="/products" class="btn btn-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProductFormComponent implements OnInit {
  private production = inject(ProductionService);
  batches = signal<ProductionBatch[]>([]);
  private svc    = inject(ProductService);
  private fb     = inject(FormBuilder);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit  = signal(false);
  loading = signal(false);
  error   = signal('');
  private id = '';

  form = this.fb.group({
    name:         ['', requiredText],
    product_type: ['', Validators.required],
    price:        [0,  [Validators.required, Validators.min(0)]],
    quantity:     [0,  [Validators.required, Validators.min(0)]],
    unit:         ['kg', Validators.required],
    expiry_date:  [''],
    batch_id:     [''],
    description:  [''],
    is_active:    [false],
  }, { validators: group => {
    const end = this.batches().find(batch => batch.id === group.get('batch_id')?.value)?.end_date;
    const expiry = group.get('expiry_date')?.value;
    return end && expiry && expiry < end ? { dateOrder: 'expiry_date' } : null;
  } });

  ngOnInit() {
    this.loadBatches(1);
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.isEdit.set(true);
      this.svc.getById(this.id).subscribe(res => { this.form.patchValue(res.data as any); this.form.controls.quantity.disable(); this.form.controls.unit.disable(); if(res.data.batch_id) this.form.controls.batch_id.disable(); });
    }
  }

  private loadBatches(page: number) {
    this.production.listBatches({ page, limit: 100 }).subscribe({
      next: response => {
        const result = response.data;
        this.batches.update(items => [...items, ...result.data]);
        this.form.updateValueAndValidity();
        if (page * result.limit < result.total) this.loadBatches(page + 1);
      },
      error: () => this.error.set('Could not load production batches. Reload to select a batch.'),
    });
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const payload = {
      name:         raw.name!,
      product_type: raw.product_type!,
      price:        Number(raw.price),
      quantity:     undefined,
      unit:         undefined,
      expiry_date:  raw.expiry_date || undefined,
      batch_id:     raw.batch_id || undefined,
      description:  raw.description || undefined,
      is_active:    raw.is_active ?? true,
    };

    const obs = this.isEdit()
      ? this.svc.update(this.id, payload)
      : this.svc.update(this.id, payload);

    obs.subscribe({
      next:  () => this.router.navigate([raw.is_active ? '/products' : '/storage']),
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to save'); this.loading.set(false); },
    });
  }
}
