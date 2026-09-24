import { TypePickerComponent } from '../../../shared/type-picker.component';
import { dateOrder } from '../../../shared/form-validators';
import { requiredText } from '../../../shared/form-validators';
import { FieldErrorsDirective } from '../../../shared/field-errors.directive';
import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { inject } from '@angular/core';
import { RawMaterialsService } from '../../../core/services/raw-materials.service';
import {RawMaterial, RawMaterialRequest} from '../../../shared/models/raw-material.models'

@Component({
  selector: 'app-raw-material-form',
  standalone: true,
  imports: [TypePickerComponent, FieldErrorsDirective, ReactiveFormsModule, RouterLink],
  templateUrl: './raw-material-form.component.html',
})
export class RawMaterialFormComponent implements OnInit {
  private svc   = inject(RawMaterialsService);
  private fb    = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isEdit  = signal(false);
  loading = signal(false);
  error   = signal('');
  private id = '';

  form = this.fb.group({
    name:                ['', requiredText],
    material_type:       ['', Validators.required],
    quantity:            [0,  [Validators.required, Validators.min(0)]],
    unit:                ['kg', Validators.required],
    supplier:            [''],
    origin:              [''],
    received_date:       [''],
    harvest_date:        [''],
    expiry_date:         [''],
    notes:               [''],
    low_stock_threshold: [null as number | null, Validators.min(0)],
  }, { validators: [dateOrder('harvest_date', 'expiry_date'), dateOrder('received_date', 'expiry_date')] });

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    if (this.id) {
      this.isEdit.set(true);
      this.svc.getById(this.id).subscribe(res => this.form.patchValue((res.data)));
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');

    const raw = this.form.getRawValue();
    let request : RawMaterialRequest = {
      name: raw.name!,
      material_type: raw.material_type!,
      quantity: Number(raw.quantity!),
      unit: raw.unit!,
      supplier: raw.supplier!,
      origin: raw.origin!,
      received_date: raw.received_date || undefined,
      harvest_date: raw.harvest_date || undefined,
      expiry_date: raw.expiry_date || undefined,
      notes: raw.notes!,
      low_stock_threshold: raw.low_stock_threshold == null ? undefined : Number(raw.low_stock_threshold),
    };
    const obs = this.isEdit()
      ? this.svc.update(this.id, request)
      : this.svc.create(request);

    obs.subscribe({
      next: () => this.router.navigate(['/raw-materials']),
      error: (e) => { this.error.set(e.error?.error ?? 'Failed to save'); this.loading.set(false); },
    });
  }
}
