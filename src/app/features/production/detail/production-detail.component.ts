import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductionService } from '../../../core/services/production.service';
import { RawMaterialsService } from '../../../core/services/raw-materials.service';
import { ProductionBatch, ProcessStep, BatchRawMaterial, BATCH_STATUS_TRANSITIONS, BatchStatus } from '../../../shared/models/production.models';
import { RawMaterial } from '../../../shared/models/raw-material.models';

@Component({
  selector: 'app-production-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (batch()) {

        <div class="page-header">
          <div>
            <h1 class="page-title">{{ batch()!.name }}</h1>
            <p class="page-subtitle">
              <span class="badge badge-planned">{{ batch()!.process_type }}</span>
              &nbsp;<span [class]="statusClass(batch()!.status)">{{ batch()!.status }}</span>
            </p>
          </div>
          <div class="actions">
            <a [routerLink]="['/production', batch()!.id, 'edit']" class="btn btn-secondary">✏️ Edit</a>
            <button class="btn btn-danger" (click)="confirmDelete()">🗑️ Delete</button>
          </div>
        </div>

        <!-- Status transitions -->
        @if (nextStatuses().length > 0) {
          <div class="alert alert-success" style="margin-bottom:20px;display:flex;align-items:center;gap:12px">
            <span>Advance status:</span>
            @for (s of nextStatuses(); track s) {
              <button class="btn btn-sm btn-primary" (click)="advanceStatus(s)">→ {{ s }}</button>
            }
          </div>
        }

        <div class="detail-layout">

          <!-- Batch info -->
          <div class="card">
            <h3 style="margin-bottom:16px">Batch Info</h3>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Start Date</div>
                <div class="info-value">{{ batch()!.start_date ?? '—' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">End Date</div>
                <div class="info-value">{{ batch()!.end_date ?? '—' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Created</div>
                <div class="info-value text-muted text-sm">{{ batch()!.created_at | date:'mediumDate' }}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Updated</div>
                <div class="info-value text-muted text-sm">{{ batch()!.updated_at | date:'mediumDate' }}</div>
              </div>
            </div>
            @if (batch()!.notes) {
              <div style="margin-top:16px">
                <div class="info-label">Notes</div>
                <p style="margin-top:6px;color:var(--text-secondary);font-size:0.9rem">{{ batch()!.notes }}</p>
              </div>
            }
          </div>

          <!-- Process Steps -->
          <div class="card" style="margin-top:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h3>Process Steps</h3>
              <button class="btn btn-sm btn-secondary" (click)="showAddStep = !showAddStep">
                {{ showAddStep ? 'Cancel' : '+ Add Step' }}
              </button>
            </div>

            @if (showAddStep) {
              <form [formGroup]="stepForm" (ngSubmit)="addStep()" class="add-form">
                <div class="form-grid cols-3">
                  <div class="form-group">
                    <label class="form-label">Order *</label>
                    <input class="form-control" type="number" formControlName="step_order" min="1" />
                  </div>
                  <div class="form-group" style="grid-column:span 2">
                    <label class="form-label">Step Name *</label>
                    <input class="form-control" formControlName="name" placeholder="e.g. Salt rubbing" />
                  </div>
                  <div class="form-group form-full">
                    <label class="form-label">Description</label>
                    <input class="form-control" formControlName="description" placeholder="Details…" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Duration (hours)</label>
                    <input class="form-control" type="number" formControlName="duration_hours" min="0" step="0.5" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Temperature (°C)</label>
                    <input class="form-control" type="number" formControlName="temperature" step="0.1" />
                  </div>
                </div>
                <button class="btn btn-primary btn-sm" type="submit" [disabled]="stepForm.invalid" style="margin-top:10px">
                  Add Step
                </button>
              </form>
              @if (stepError()) {
                <div class="alert alert-danger" style="margin-top:16px">{{ stepError() }}</div>
              }
            }

            @if (batch()!.steps.length === 0 && !showAddStep) {
              <p class="text-muted text-sm">No steps added yet.</p>
            } @else {
              <div class="steps-timeline">
                @for (s of batch()!.steps; track s.id) {
                  <div class="timeline-item">
                    <div class="timeline-num">{{ s.step_order }}</div>
                    <div class="timeline-content">
                      <div class="timeline-title">{{ s.name }}</div>
                      @if (s.description) {
                        <div class="timeline-desc">{{ s.description }}</div>
                      }
                      <div class="timeline-meta">
                        @if (s.duration_hours) { <span>⏱ {{ s.duration_hours }}h</span> }
                        @if (s.temperature) { <span>🌡 {{ s.temperature }}°C</span> }
                      </div>
                    </div>
                    <button class="btn btn-sm btn-ghost" (click)="deleteStep(s)" title="Remove">✕</button>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Raw Materials -->
          <div class="card" style="margin-top:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h3>Raw Materials</h3>
              <button class="btn btn-sm btn-secondary" (click)="toggleAddMaterial()">
                {{ showAddMaterial ? 'Cancel' : '+ Add Material' }}
              </button>
            </div>

            @if (showAddMaterial) {
              <form [formGroup]="materialForm" (ngSubmit)="addMaterial()" class="add-form">
                <div class="form-grid">
                  <div class="form-group form-full">
                    <label class="form-label">Raw Material *</label>
                    <select class="form-control" formControlName="raw_material_id">
                      <option value="">Select material…</option>
                      @for (m of availableMaterials(); track m.id) {
                        <option [value]="m.id">{{ m.name }} ({{ m.quantity }} {{ m.unit }} available)</option>
                      }
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Quantity Used *</label>
                    <input class="form-control" type="number" formControlName="quantity_used" min="0.001" step="0.001" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Unit *</label>
                    <select class="form-control" formControlName="unit">
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="l">l</option>
                      <option value="ml">ml</option>
                      <option value="pcs">pcs</option>
                    </select>
                  </div>
                </div>
                <button class="btn btn-primary btn-sm" type="submit" [disabled]="materialForm.invalid" style="margin-top:10px">
                  Add Material
                </button>
              </form>
              @if (materialError()) {
                <div class="alert alert-danger" style="margin-top:16px">{{ materialError() }}</div>
              }
            }

            @if (batch()!.raw_materials.length === 0 && !showAddMaterial) {
              <p class="text-muted text-sm">No materials linked yet.</p>
            } @else {
              <table>
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Type</th>
                    <th>Quantity Used</th>
                    <th>Origin</th>
                    <th>Supplier</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (m of batch()!.raw_materials; track m.id) {
                    <tr>
                      <td><strong>{{ m.name }}</strong></td>
                      <td><span class="badge badge-planned">{{ m.material_type }}</span></td>
                      <td class="font-mono">{{ m.quantity_used }} {{ m.unit }}</td>
                      <td class="text-muted">{{ m.origin ?? '—' }}</td>
                      <td class="text-muted">{{ m.supplier ?? '—' }}</td>
                      <td>
                        <button class="btn btn-sm btn-ghost" (click)="removeMaterial(m)" title="Remove">✕</button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

        </div>
      }
    </div>
  `,
  styles: [`
    .detail-layout { display: flex; flex-direction: column; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px; }
    .info-value { font-size: 0.95rem; font-weight: 600; }

    .add-form { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; }

    .steps-timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-num { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
    .timeline-content { flex: 1; }
    .timeline-title { font-weight: 700; font-size: 0.9rem; }
    .timeline-desc { font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px; }
    .timeline-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 0.8rem; color: var(--text-muted); }
  `]
})
export class ProductionDetailComponent implements OnInit {
  private svc         = inject(ProductionService);
  private materialsSvc = inject(RawMaterialsService);
  private fb          = inject(FormBuilder);
  private route       = inject(ActivatedRoute);
  private router      = inject(Router);

  batch              = signal<ProductionBatch | null>(null);
  loading            = signal(true);
  availableMaterials = signal<RawMaterial[]>([]);
  stepError   = signal('');
  materialError   = signal('');
  showAddStep        = false;
  showAddMaterial    = false;

  private id = '';

  nextStatuses = () => {
    const b = this.batch();
    if (!b) return [];
    return BATCH_STATUS_TRANSITIONS[b.status as BatchStatus] ?? [];
  };

  stepForm = this.fb.group({
    step_order:     [1, [Validators.required, Validators.min(1)]],
    name:           ['', Validators.required],
    description:    [''],
    duration_hours: [null as number | null],
    temperature:    [null as number | null],
  });

  materialForm = this.fb.group({
    raw_material_id: ['', Validators.required],
    quantity_used:   [null as number | null, [Validators.required, Validators.min(0.001)]],
    unit:            ['kg', Validators.required],
  });

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    this.load();
    this.materialsSvc.list({ limit: 100 }).subscribe(res => this.availableMaterials.set(res.data.data));
  }

  load() {
    this.loading.set(true);
    this.svc.getBatch(this.id).subscribe({
      next:  res => {
        this.batch.set(res.data as unknown as ProductionBatch);
        this.loading.set(false);
      },
      error: ()  => this.loading.set(false),
    });
  }

  advanceStatus(status: BatchStatus) {
    this.svc.updateBatch(this.id, { status }).subscribe(res => {
      this.batch.set(res.data as unknown as ProductionBatch)
    });
  }

  addStep() {
    if (this.stepForm.invalid) return;
    this.stepError.set('');

    const raw = this.stepForm.getRawValue();
    this.svc.addStep(this.id, {
      step_order:     raw.step_order!,
      name:           raw.name!,
      description:    raw.description || undefined,
      duration_hours: raw.duration_hours ?? undefined,
      temperature:    raw.temperature   ?? undefined,
    }).subscribe({
      next: ()=> {
        this.stepForm.reset({step_order: 1});
        this.showAddStep = false;
        this.load();
      },
      error: err => {
        console.log(err)
         this.stepError.set(err.error?.error ?? 'Failed to save'); this.loading.set(false);
      }
  });
  }

  deleteStep(s: ProcessStep) {
    if (!confirm('Remove step "' + s.name + '"?')) return;
    this.svc.deleteStep(this.id, s.id).subscribe(() => this.load());
  }

  toggleAddMaterial() {
    this.showAddMaterial = !this.showAddMaterial;
  }

  addMaterial() {
    if (this.materialForm.invalid) return;
    this.materialError.set('');

    const raw = this.materialForm.getRawValue();
    this.svc.addMaterial(this.id, {
      raw_material_id: raw.raw_material_id!,
      quantity_used:   raw.quantity_used!,
      unit:            raw.unit!,
    }).subscribe({
      next: () => {
        this.materialForm.reset({unit: 'kg'});
        this.showAddMaterial = false;
        this.load();
      },
      error: err => {
        this.materialError.set(err.error?.error ?? 'Failed to save'); this.loading.set(false);
      }
    });
  }

  removeMaterial(m: BatchRawMaterial) {
    if (!confirm('Remove "' + m.name + '" from this batch?')) return;
    this.svc.removeMaterial(this.id, m.id).subscribe(() => this.load());
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      PLANNED:     'badge badge-planned',
      IN_PROGRESS: 'badge badge-in-progress',
      COMPLETED:   'badge badge-completed',
      CANCELLED:   'badge badge-cancelled',
    };
    return map[status] ?? 'badge badge-planned';
  }

  confirmDelete() {
    if (!confirm('Delete batch "' + this.batch()!.name + '"?')) return;
    this.svc.deleteBatch(this.id).subscribe(() => this.router.navigate(['/production']));
  }
}
