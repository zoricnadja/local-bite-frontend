import { dateOrder } from '../../../shared/form-validators';
import { RawMaterialsService } from '../../../core/services/raw-materials.service';
import { RawMaterial } from '../../../shared/models/raw-material.models';
import { requiredText } from '../../../shared/form-validators';
import { FieldErrorsDirective } from '../../../shared/field-errors.directive';
import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductionService } from '../../../core/services/production.service';
import {BatchStatus, ProductionBatch} from '../../../shared/models/production.models';

const ALL_STATUSES: BatchStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [FieldErrorsDirective, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ isEdit() ? 'Edit' : 'New' }} Batch</h1>
        </div>
        <a routerLink="/production" class="btn btn-secondary">← Back</a>
      </div>

      <p class="page-subtitle">A batch covers the full production cycle. Add phases such as curing, smoking and drying as process steps inside the batch.</p>
      <div class="card" style="max-width:640px">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">

            <div class="form-group form-full">
              <label class="form-label">Batch Name *</label>
              <input class="form-control" formControlName="name" placeholder="e.g. Sausage batch – Spring 2026" />
            </div>


            @if (isEdit()) {
              <div class="form-group">
                <label class="form-label">Status</label>
                <input class="form-control" formControlName="status" readonly /><small class="text-muted">Change status from the production details page.</small>
              </div>
            }

            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input class="form-control" type="date" formControlName="start_date" />
            </div>

            <div class="form-group">
              <label class="form-label">End Date</label>
              <input class="form-control" type="date" formControlName="end_date" />
            </div>

            <div class="form-group form-full">
              <label class="form-label">Notes</label>
              <textarea class="form-control" formControlName="notes" placeholder="Any additional notes…"></textarea>
            </div>

          </div>

          @if (!isEdit()) {
            <section style="margin-top:20px" formArrayName="raw_materials">
              <h3>Raw materials</h3><p class="text-muted">Selected quantities are deducted from stock when the batch is created.</p>
              @for (row of form.controls.raw_materials.controls; track row; let i = $index) {
                <div class="form-grid" [formGroupName]="i" style="margin-top:12px">
                  <div class="form-group"><label class="form-label">Material *</label><select class="form-control" formControlName="raw_material_id" (change)="selectMaterial(i)"><option value="">Select material</option>@for (m of materials(); track m.id) { <option [value]="m.id">{{ m.name }} ({{ m.quantity }} {{ m.unit }} available)</option> }</select></div>
                  <div class="form-group"><label class="form-label">Quantity used *</label><input class="form-control" type="number" min="0.001" step="0.001" formControlName="quantity_used" /></div>
                  <div class="form-group"><label class="form-label">Unit</label><input class="form-control" formControlName="unit" readonly /></div>
                  <button type="button" class="icon-action" aria-label="Remove material" title="Remove material" (click)="form.controls.raw_materials.removeAt(i)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
                </div>
              }
              <button type="button" class="icon-action" style="margin-top:12px" (click)="addMaterial()" [disabled]="materials().length === 0" aria-label="Add material" title="Add material"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
            </section>
          }
          @if (error()) {
            <div class="alert alert-danger" style="margin-top:16px">{{ error() }}</div>
          }

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-primary" type="submit" [disabled]="loading()">
              @if (loading()) { <span class="spinner"></span> }
              {{ isEdit() ? 'Save changes' : 'Create batch' }}
            </button>
            <a routerLink="/production" class="btn btn-secondary">Cancel</a>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProductionFormComponent implements OnInit {
  private materialsSvc = inject(RawMaterialsService);
  materials = signal<RawMaterial[]>([]);
  private svc    = inject(ProductionService);
  private fb     = inject(FormBuilder);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit  = signal(false);
  loading = signal(false);
  error   = signal('');
  statuses = ALL_STATUSES;
  private id = '';

  form = this.fb.group({
    name:         ['', requiredText],
    status:       ['PLANNED'],
    start_date:   [''],
    end_date:     [''],
    notes:        [''],
    raw_materials: this.fb.array<ReturnType<ProductionFormComponent['newMaterial']>>([]),
  }, { validators: dateOrder('start_date', 'end_date') });

  newMaterial() { return this.fb.group({ raw_material_id: ['', Validators.required], quantity_used: [null as number | null, [Validators.required, Validators.min(0.001)]], unit: ['', Validators.required] }); }
  addMaterial() { this.form.controls.raw_materials.push(this.newMaterial()); }
  selectMaterial(index: number) {
    const row = this.form.controls.raw_materials.at(index);
    const material = this.materials().find(m => m.id === row.controls.raw_material_id.value);
    if (material) { row.controls.unit.setValue(material.unit); row.controls.quantity_used.setValidators([Validators.required, Validators.min(0.001), Validators.max(Number(material.quantity))]); row.controls.quantity_used.updateValueAndValidity(); }
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.id) this.materialsSvc.list({ limit: 100 }).subscribe({ next: res => this.materials.set(res.data.data), error: () => this.error.set('Could not load materials. Try again before adding materials.') });
    if (this.id) {
      this.isEdit.set(true);
      this.svc.getBatch(this.id).subscribe(res => {
        const b = res.data;
        this.form.patchValue({
          name:         (b).name,
          status:       (b).status,
          start_date:   (b).start_date ?? '',
          end_date:     (b).end_date ?? '',
          notes:        (b).notes ?? '',
        });
      });
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const payload = {
      name:         raw.name!,
      status:       (raw.status as BatchStatus) || undefined,
      start_date:   raw.start_date || undefined,
      end_date:     raw.end_date   || undefined,
      notes:        raw.notes      || undefined,
      raw_materials: raw.raw_materials.map(m => ({ raw_material_id: m.raw_material_id!, quantity_used: m.quantity_used!, unit: m.unit! })),
    };

    const obs = this.isEdit()
      ? this.svc.updateBatch(this.id, payload)
      : this.svc.createBatch(payload);

    obs.subscribe({
      next:  (res) => {
        this.router.navigate(['/production', (res.data).id])
      },
      error: (e)   => { this.error.set(e.error?.error ?? 'Failed to save'); this.loading.set(false); },
    });
  }
}
