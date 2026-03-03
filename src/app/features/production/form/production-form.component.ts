import { Component, OnInit, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductionService } from '../../../core/services/production.service';
import {BatchStatus, ProductionBatch} from '../../../shared/models/production.models';

const ALL_STATUSES: BatchStatus[] = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

@Component({
  selector: 'app-production-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ isEdit() ? 'Edit' : 'New' }} Batch</h1>
        </div>
        <a routerLink="/production" class="btn btn-secondary">← Back</a>
      </div>

      <div class="card" style="max-width:640px">
        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-grid">

            <div class="form-group form-full">
              <label class="form-label">Batch Name *</label>
              <input class="form-control" formControlName="name" placeholder="e.g. Spring Curing 2026" />
            </div>

            <div class="form-group">
              <label class="form-label">Process Type *</label>
              <select class="form-control" formControlName="process_type">
                <option value="">Select type…</option>
                <option value="curing">Curing</option>
                <option value="smoking">Smoking</option>
                <option value="fermentation">Fermentation</option>
                <option value="aging">Aging</option>
                <option value="drying">Drying</option>
                <option value="pressing">Pressing</option>
                <option value="other">Other</option>
              </select>
            </div>

            @if (isEdit()) {
              <div class="form-group">
                <label class="form-label">Status</label>
                <select class="form-control" formControlName="status">
                  @for (s of statuses; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
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

          @if (error()) {
            <div class="alert alert-danger" style="margin-top:16px">{{ error() }}</div>
          }

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-primary" type="submit" [disabled]="loading() || form.invalid">
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
    name:         ['', Validators.required],
    process_type: ['', Validators.required],
    status:       ['PLANNED'],
    start_date:   [''],
    end_date:     [''],
    notes:        [''],
  });

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.isEdit.set(true);
      this.svc.getBatch(this.id).subscribe(res => {
        const b = res.data;
        this.form.patchValue({
          name:         (b as unknown as ProductionBatch).name,
          process_type: (b as unknown as ProductionBatch).process_type,
          status:       (b as unknown as ProductionBatch).status,
          start_date:   (b as unknown as ProductionBatch).start_date ?? '',
          end_date:     (b as unknown as ProductionBatch).end_date ?? '',
          notes:        (b as unknown as ProductionBatch).notes ?? '',
        });
      });
    }
  }

  submit() {
    if (this.form.invalid) return;
    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    const payload = {
      name:         raw.name!,
      process_type: raw.process_type!,
      status:       (raw.status as BatchStatus) || undefined,
      start_date:   raw.start_date || undefined,
      end_date:     raw.end_date   || undefined,
      notes:        raw.notes      || undefined,
    };

    const obs = this.isEdit()
      ? this.svc.updateBatch(this.id, payload)
      : this.svc.createBatch(payload);

    obs.subscribe({
      next:  (res) => {
        this.router.navigate(['/production', (res.data as unknown as ProductionBatch).id])
      },
      error: (e)   => { this.error.set(e.error?.error ?? 'Failed to save'); this.loading.set(false); },
    });
  }
}
