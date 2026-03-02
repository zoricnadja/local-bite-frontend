import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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

            @if (isEdit()) {
              <div class="form-group" style="display:flex;align-items:center;gap:10px">
                <input type="checkbox" formControlName="is_active" id="is_active" />
                <label for="is_active" style="font-size:0.9rem;cursor:pointer">Active (visible to customers)</label>
              </div>
            }

          </div>

          @if (error()) {
            <div class="alert alert-danger" style="margin-top:16px">{{ error() }}</div>
          }

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-primary" type="submit" [disabled]="loading() || form.invalid">
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
  private svc    = inject(ProductService);
  private fb     = inject(FormBuilder);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit  = signal(false);
  loading = signal(false);
  error   = signal('');
  private id = '';

  form = this.fb.group({
    name:         ['', Validators.required],
    product_type: ['', Validators.required],
    price:        [0,  [Validators.required, Validators.min(0)]],
    quantity:     [0,  [Validators.required, Validators.min(0)]],
    unit:         ['kg', Validators.required],
    description:  [''],
    is_active:    [true],
  });

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.isEdit.set(true);
      this.svc.getById(this.id).subscribe(res => this.form.patchValue(res.data as any));
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const payload = {
      name:         raw.name!,
      product_type: raw.product_type!,
      price:        Number(raw.price),
      quantity:     Number(raw.quantity),
      unit:         raw.unit!,
      description:  raw.description || undefined,
      is_active:    raw.is_active ?? true,
    };

    const obs = this.isEdit()
      ? this.svc.update(this.id, payload)
      : this.svc.create(payload);

    obs.subscribe({
      next:  () => this.router.navigate(['/products']),
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to save'); this.loading.set(false); },
    });
  }
}
