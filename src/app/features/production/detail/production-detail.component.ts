import { requiredText } from '../../../shared/form-validators';
import { FieldErrorsDirective } from '../../../shared/field-errors.directive';
import { CanDirective } from '../../../core/auth/can.directive';
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductionService } from '../../../core/services/production.service';
import { RawMaterialsService } from '../../../core/services/raw-materials.service';
import { ProductionOutput, ProductionBatch, ProcessStep, BatchRawMaterial, BATCH_STATUS_TRANSITIONS, BatchStatus } from '../../../shared/models/production.models';
import { RawMaterial } from '../../../shared/models/raw-material.models';
import { CdkTrapFocus } from '@angular/cdk/a11y';

@Component({
  selector: 'app-production-detail',
  standalone: true,
  imports: [CdkTrapFocus, FieldErrorsDirective, CanDirective, CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="empty-state"><span class="spinner" style="width:32px;height:32px"></span></div>
      } @else if (batch()) {

        <div class="page-header">
          <div>
            <h1 class="page-title">{{ batch()!.name }}</h1>
            <p class="page-subtitle">
              &nbsp;<span [class]="statusClass(batch()!.status)">{{ batch()!.status }}</span>
            </p>
          </div>
          <div class="actions">
            <a [routerLink]="['/production', batch()!.id, 'edit']" class="icon-action" aria-label="Edit" title="Edit"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m16 3 5 5-13 13H3v-5L16 3ZM13 6l5 5"/></svg></a>
            <button *appCan="'deleteFarmData'" class="icon-action" (click)="confirmDelete()" aria-label="Delete" title="Delete"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
          </div>
        </div>

        @if (batch()!.status === 'CANCELLED') { <div class="cancelled-notice" style="margin-bottom:20px"><strong>Production cancelled</strong><p>This batch will not be completed.</p></div> }
        <!-- Status transitions -->
        @if (nextStatuses().length > 0) {
          <div class="alert alert-success" style="margin-bottom:20px;display:flex;align-items:center;gap:12px">
            <span>Advance status:</span>
            @for (s of nextStatuses(); track s) {
              <button [class]="s === 'CANCELLED' ? 'btn btn-sm btn-danger' : 'btn btn-sm btn-primary'" [disabled]="savingStatus() || (s === 'COMPLETED' && !canComplete())" (click)="advanceStatus(s)">→ {{ s }}</button>
            }
          </div>
        }

        @if (batch()!.status === 'PLANNED') { <p class="text-muted">Production starts automatically when you start a process step.</p> }
        @if (batch()!.status === 'IN_PROGRESS' && !canComplete()) { <p class="text-muted">Complete all process steps to enable production completion.</p> }
        @if (statusError()) { <div class="alert alert-danger">{{ statusError() }}</div> }
        <div class="card" style="margin-bottom:20px">
          <div class="actions"><h3>{{batch()!.status === 'COMPLETED' ? 'Final products' : 'Planned products'}}</h3>
          @if(batch()!.status === 'PLANNED' || batch()!.status === 'IN_PROGRESS') {<button class="icon-action" (click)="openOutputs(false)" aria-label="Plan products" title="Plan products"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>}</div>
          @for(output of batch()!.outputs; track output.id) {
            <p>{{output.name}} · {{output.quantity}} {{output.unit}} @if(output.planned){<span class="text-muted">(planned: {{output.planned.quantity}} {{output.planned.unit}})</span>}</p>
          }
          <a routerLink="/products" class="quiet-link">View products →</a>
        </div>
        @if(showCompletion) {
          <div class="output-backdrop"><section class="output-dialog card" role="dialog" aria-modal="true" aria-labelledby="output-title" cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (keydown.escape)="!savingStatus() && (showCompletion=false)">
            <h2 id="output-title">{{completing ? 'Complete production' : 'Plan products'}}</h2>
            <p class="text-muted">{{completing ? 'Confirm that all process steps are finished, then enter the actual products and quantities. Final products move to Storage.' : 'These products will appear in Production until the batch is completed.'}}</p>
            @if(statusError()){<div class="alert alert-danger" role="alert">{{statusError()}}</div>}
            <form #outputsForm="ngForm" (ngSubmit)="saveOutputs(outputsForm.valid === true)">
            @for(output of draftOutputs; track $index; let i=$index) {
              <fieldset class="output-row"><legend>Product {{i+1}}</legend>
              @if(output.planned){<p class="text-muted">Planned: {{output.planned.name}} · {{output.planned.quantity}} {{output.planned.unit}} · €{{output.planned.price}}</p>}
              <div class="form-grid">
                <label class="form-group">Name *<input class="form-control" required [name]="'name'+i" [(ngModel)]="output.name" /></label>
                <label class="form-group">Type *<select class="form-control" required [name]="'type'+i" [(ngModel)]="output.product_type">@for(t of outputTypes;track t){<option [value]="t">{{t}}</option>}</select></label>
                <label class="form-group">{{completing ? 'Actual quantity' : 'Planned quantity'}} *<input class="form-control" type="number" required min="0.001" step="0.001" [name]="'quantity'+i" [(ngModel)]="output.quantity" /></label>
                <label class="form-group">Unit *<select class="form-control" required [name]="'unit'+i" [(ngModel)]="output.unit">@for(u of ['kg','g','l','ml','pcs'];track u){<option [value]="u">{{u}}</option>}</select></label>
                <label class="form-group">Price *<input class="form-control" type="number" required min="0" step="0.01" [name]="'price'+i" [(ngModel)]="output.price" /></label>
                <label class="form-group">Expiry date<input class="form-control" type="date" [name]="'expiry'+i" [(ngModel)]="output.expiry_date" /></label>
                <label class="form-group form-full">Description<input class="form-control" [name]="'description'+i" [(ngModel)]="output.description" /></label>
              </div>
              <button type="button" class="icon-action" [disabled]="savingStatus()" (click)="draftOutputs.splice(i,1)" aria-label="Remove product" title="Remove product"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
              </fieldset>
            }
            <button type="button" class="icon-action" [disabled]="savingStatus()" (click)="addOutput()" aria-label="Add product" title="Add product"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
            @if(completing){<label class="form-group">Production end *<input class="form-control" name="endDate" required type="date" [(ngModel)]="outputEndDate" /></label>}
            <div class="actions"><button type="submit" class="btn btn-primary" [disabled]="savingStatus() || (completing && !draftOutputs.length)">{{savingStatus() ? 'Saving…' : completing ? 'Complete production' : 'Save plan'}}</button><button type="button" class="btn btn-secondary" [disabled]="savingStatus()" (click)="showCompletion=false">Cancel</button></div>
            </form>
          </section></div>
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
              <button *ngIf="batch()!.status !== 'COMPLETED' && batch()!.status !== 'CANCELLED'" class="icon-action" (click)="showAddStep = !showAddStep" [attr.aria-label]="showAddStep ? 'Cancel' : 'Add step'" [title]="showAddStep ? 'Cancel' : 'Add step'">@if (showAddStep) { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg> } @else { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> }</button>
            </div>

            <p class="text-muted">Start a step to start production. Complete every step before confirming the final products.</p>
            @if (stepError() && !showAddStep) { <div class="alert alert-danger" role="alert">{{ stepError() }}</div> }
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
                  <div class="form-group form-full" formArrayName="variables">
                    <label class="form-label">Step variables</label>
                    @for (variable of stepForm.controls.variables.controls; track variable; let i = $index) {
                      <div class="form-grid" [formGroupName]="i">
                        <label class="form-group">Variable name<input class="form-control" formControlName="name" maxlength="100" placeholder="e.g. Temperature" /></label>
                        <label class="form-group">Variable value<input class="form-control" formControlName="value" maxlength="1000" placeholder="e.g. 18 °C" /></label>
                        <button type="button" class="btn btn-secondary btn-sm" (click)="stepForm.controls.variables.removeAt(i)">Remove variable</button>
                      </div>
                    }
                    <button type="button" class="btn btn-secondary btn-sm" (click)="addVariable()" [disabled]="stepForm.controls.variables.length >= 50">Add variable</button>
                  </div>
                </div>
                <button class="btn btn-primary" type="submit" [disabled]="false" style="margin-top:10px" aria-label="Add Step" title="Add Step">Save step</button>
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
                      <div class="timeline-title">{{ s.name }} <span class="step-status" [class.active]="s.status === 'IN_PROGRESS'" [class.done]="s.status === 'COMPLETED'">{{ s.status === 'PLANNED' ? 'Planned' : s.status === 'IN_PROGRESS' ? 'In progress' : 'Completed' }}</span></div>
                      @if (s.description) {
                        <div class="timeline-desc">{{ s.description }}</div>
                      }
                      <div class="timeline-meta">
                        @for (variable of s.variables; track $index) { <span>{{ variable.name }}: {{ variable.value }}</span> }
                      </div>
                    </div>
                    <div class="step-actions">
                      @if (batch()!.status !== 'COMPLETED' && batch()!.status !== 'CANCELLED' && s.status !== 'COMPLETED') {
                        <button type="button" class="step-action" [class.finish]="s.status === 'IN_PROGRESS'" [disabled]="stepSaving()" (click)="advanceStep(s)" [attr.aria-label]="(s.status === 'PLANNED' ? 'Start step: ' : 'Complete step: ') + s.name">
                          <svg viewBox="0 0 24 24" aria-hidden="true">@if (s.status === 'PLANNED') { <path d="m9 5 10 7-10 7Z"/> } @else { <path d="m5 12 4 4L19 6"/> }</svg>
                          {{ s.status === 'PLANNED' ? 'Start' : 'Complete' }}
                        </button>
                      }
                      <button class="icon-action" [disabled]="stepSaving() || batch()!.status === 'COMPLETED' || batch()!.status === 'CANCELLED'" (click)="deleteStep(s)" title="Delete step" aria-label="Delete step"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <!-- Raw Materials -->
          <div class="card" style="margin-top:16px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
              <h3>Raw Materials</h3>
              <button *ngIf="batch()!.status !== 'COMPLETED' && batch()!.status !== 'CANCELLED'" class="icon-action" (click)="toggleAddMaterial()" [attr.aria-label]="showAddMaterial ? 'Cancel' : 'Add material'" [title]="showAddMaterial ? 'Cancel' : 'Add material'">@if (showAddMaterial) { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg> } @else { <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg> }</button>
            </div>

            @if (showAddMaterial) {
              <form [formGroup]="materialForm" (ngSubmit)="addMaterial()" class="add-form">
                <div class="form-grid">
                  <div class="form-group form-full">
                    <label class="form-label">Raw Material *</label>
                    <select class="form-control" formControlName="raw_material_id" (change)="selectMaterial()">
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
                <button class="icon-action" type="submit" [disabled]="false" style="margin-top:10px" aria-label="Add Material" title="Add Material"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>
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
                        <button *ngIf="batch()!.status !== 'COMPLETED'" class="icon-action" [disabled]="batch()!.status === 'CANCELLED'" (click)="removeMaterial(m)" title="Delete material" aria-label="Delete material"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/></svg></button>
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
    .output-backdrop { position:fixed; inset:0; z-index:200; background:#17251a99; display:grid; place-items:center; padding:20px; }
    .output-dialog { width:min(760px,100%); max-height:90vh; overflow:auto; }
    .output-dialog form > .btn { margin:0 0 16px; }
    .output-dialog .form-grid { margin-bottom:12px; }
    .output-row { border:1px solid var(--border); border-radius:8px; padding:16px; margin:16px 0; }
    .detail-layout { display: flex; flex-direction: column; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .info-label { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 4px; }
    .info-value { font-size: 0.95rem; font-weight: 600; }

    .add-form { background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 16px; }

    .steps-timeline { display: flex; flex-direction: column; gap: 0; }
    .timeline-item { display: flex; align-items: flex-start; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--border); }
    .timeline-item:last-child { border-bottom: none; }
    .timeline-num { width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700; flex-shrink: 0; }
    .timeline-content { flex: 1; min-width:0; }
    .timeline-title { display:flex; align-items:center; flex-wrap:wrap; gap:8px; font-weight:700; font-size:0.9rem; overflow-wrap:anywhere; }
    .timeline-desc { font-size: 0.82rem; color: var(--text-secondary); margin-top: 2px; }
    .timeline-meta { display:flex; flex-wrap:wrap; gap:12px; margin-top:4px; font-size:0.8rem; color:var(--text-muted); overflow-wrap:anywhere; }
    .step-status { display:inline-flex; align-items:center; gap:5px; font-size:.72rem; font-weight:500; color:var(--text-muted); white-space:nowrap; }
    .step-status:before { content:''; width:6px; height:6px; border-radius:50%; background:currentColor; }
    .step-status.active { color:#9a6700; }
    .step-status.done { color:#267044; }
    .step-actions { display:flex; align-items:center; gap:8px; }
    .step-action { display:inline-flex; align-items:center; justify-content:center; gap:6px; min-height:36px; padding:6px 12px; border:1px solid var(--border); border-radius:8px; background:var(--surface); color:var(--text-secondary); font:inherit; font-size:.8rem; font-weight:600; cursor:pointer; transition:background .15s,border-color .15s; }
    .step-action.finish { color:#267044; background:#f0f8f2; border-color:#cce1d2; }
    .step-action:hover:not(:disabled) { background:#e6f1e9; border-color:#a2c7ae; }
    .step-action:focus-visible { outline:2px solid var(--accent); outline-offset:3px; }
    .step-action:disabled { opacity:.5; cursor:wait; }
    .step-action svg { width:15px; height:15px; fill:none; stroke:currentColor; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
    @media(max-width:600px) { .timeline-item { flex-wrap:wrap; gap:10px; } .step-actions { width:100%; justify-content:flex-end; } }
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
  stepSaving = signal(false);
  materialError   = signal('');
  showAddStep        = false;
  showAddMaterial    = false;

  showCompletion=false;
  savingStatus=signal(false); statusError=signal('');
  outputTypes=['meat','dairy','vegetable','fruit','cheese','sausage','honey','other'];
  completing=false; draftOutputs: ProductionOutput[]=[]; outputEndDate='';
  openOutputs(completing:boolean) {
    this.completing=completing; this.statusError.set('');
    this.draftOutputs=(this.batch()!.outputs || []).map(o=>({...o,planned:completing ? {...o} : undefined}));
    if(!this.draftOutputs.length)this.addOutput();
    this.outputEndDate=this.batch()!.end_date || new Date().toISOString().slice(0,10);
    this.showCompletion=true;
  }
  addOutput(){this.draftOutputs.push({name:'',product_type:'other',quantity:1,unit:'kg',price:0});}
  saveOutputs(valid:boolean) {
    if(!valid || this.draftOutputs.some(o=>!o.name.trim())){this.statusError.set('Enter valid product details.');return;}
    this.savingStatus.set(true); this.statusError.set('');
    const outputs=this.draftOutputs.map(({planned,...o})=>({...o,expiry_date:o.expiry_date || undefined}));
    this.svc.updateBatch(this.id,{outputs,...(this.completing ? {status:'COMPLETED' as const,end_date:this.outputEndDate} : {})}).subscribe({next:r=>{this.batch.set(r.data);this.showCompletion=false;this.savingStatus.set(false);},error:e=>{this.statusError.set(e.error?.error??'Could not save products');this.savingStatus.set(false);}});
  }
  private id = '';

  nextStatuses = () => {
    const b = this.batch();
    if (!b) return [];
    return (BATCH_STATUS_TRANSITIONS[b.status as BatchStatus] ?? []).filter(status => status !== 'IN_PROGRESS');
  };

  canComplete = () => !!this.batch()?.steps.length && this.batch()!.steps.every(step => step.status === 'COMPLETED');

  advanceStep(step: ProcessStep) {
    if (this.stepSaving()) return;
    this.stepSaving.set(true);
    this.stepError.set('');
    this.svc.updateStep(this.id, step.id, { status: step.status === 'PLANNED' ? 'IN_PROGRESS' : 'COMPLETED' }).subscribe({
      next: () => { this.stepSaving.set(false); this.load(); },
      error: e => { this.stepSaving.set(false); this.stepError.set(e.error?.error ?? 'Could not update step status'); },
    });
  }

  stepForm = this.fb.group({
    step_order:     [1, [Validators.required, Validators.min(1)]],
    name:           ['', requiredText],
    description:    [''],
    variables: this.fb.array<ReturnType<ProductionDetailComponent['newVariable']>>([]),
  });

  newVariable() { return this.fb.group({ name: ['', [requiredText, Validators.maxLength(100)]], value: ['', [requiredText, Validators.maxLength(1000)]] }); }
  addVariable() { this.stepForm.controls.variables.push(this.newVariable()); }

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
    this.materialsSvc.list({ limit: 100 }).subscribe(res => this.availableMaterials.set(res.data.data));
    this.svc.getBatch(this.id).subscribe({
      next:  res => {
        this.batch.set(res.data);
        this.stepForm.controls.step_order.setValue(Math.max(0, ...res.data.steps.map(s => s.step_order)) + 1);
        this.loading.set(false);
      },
      error: ()  => this.loading.set(false),
    });
  }

  advanceStatus(status: BatchStatus) {
    if(status==='COMPLETED'){this.openOutputs(true);return;}
    this.statusError.set('');
    this.svc.updateBatch(this.id,{status}).subscribe({next:res=>this.batch.set(res.data),error:e=>this.statusError.set(e.error?.error??'Could not change status')});
  }

  addStep() {
    if (this.stepForm.invalid) { this.stepForm.markAllAsTouched(); return; }
    this.stepError.set('');

    const raw = this.stepForm.getRawValue();
    this.svc.addStep(this.id, {
      step_order:     raw.step_order!,
      name:           raw.name!,
      description:    raw.description || undefined,
      variables: raw.variables.map(v => ({ name: v.name!.trim(), value: v.value!.trim() })),
    }).subscribe({
      next: ()=> {
        this.stepForm.controls.variables.clear();
        this.stepForm.reset({step_order: Math.max(0, ...this.batch()!.steps.map(s => s.step_order), raw.step_order!) + 1});
        this.showAddStep = false;
        this.load();
      },
      error: err => {
        
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

  selectMaterial() {
    const material = this.availableMaterials().find(m => m.id === this.materialForm.controls.raw_material_id.value);
    if (!material) return;
    this.materialForm.controls.unit.setValue(material.unit);
    this.materialForm.controls.quantity_used.setValidators([Validators.required, Validators.min(0.001), Validators.max(Number(material.quantity))]);
    this.materialForm.controls.quantity_used.updateValueAndValidity();
  }

  addMaterial() {
    if (this.materialForm.invalid) { this.materialForm.markAllAsTouched(); return; }
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
