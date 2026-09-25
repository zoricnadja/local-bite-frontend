import { requiredText, websiteUrl } from '../../../shared/form-validators';
import { FieldErrorsDirective } from '../../../shared/field-errors.directive';
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BusinessService } from '../../../core/services/business.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Business } from '../../../shared/models/auth.models';

@Component({
  selector: 'app-create-business',
  standalone: true,
  imports: [FieldErrorsDirective, CommonModule, ReactiveFormsModule],
  templateUrl: './create-business.component.html',
  styleUrls: ['./create-business.component.css'],
})
export class CreateBusinessComponent {
  private fb      = inject(FormBuilder);
  private businessSvc = inject(BusinessService);
  private auth    = inject(AuthService);
  private router  = inject(Router);

  loading = signal(false);
  error   = signal<string | null>(null);
  created = signal<Business | null>(null);

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    address:     ['', requiredText],
    phone:       [''],
    description: [''],
    website:     ['', websiteUrl],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const v = this.form.getRawValue();
    this.businessSvc.createBusiness({
      name:        v.name!,
      address:     v.address!,
      phone:       v.phone       || undefined,
      description: v.description || undefined,
      website:     v.website     || undefined,
    }).subscribe({
      next: business => {
        this.created.set(business);
        this.auth.refreshUser().subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/profile']);
          },
          error: () => this.loading.set(false),
        });
      },
      error: err => {
        this.error.set(err?.error?.error ?? 'Failed to add business');
        this.loading.set(false);
      },
    });
  }
}