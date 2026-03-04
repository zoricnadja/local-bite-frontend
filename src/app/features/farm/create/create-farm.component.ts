import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FarmService } from '../../../core/services/farm.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Farm } from '../../../shared/models/auth.models';

@Component({
  selector: 'app-create-farm',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-farm.component.html',
  styleUrls: ['./create-farm.component.css'],
})
export class CreateFarmComponent {
  private fb      = inject(FormBuilder);
  private farmSvc = inject(FarmService);
  private auth    = inject(AuthService);
  private router  = inject(Router);

  loading = signal(false);
  error   = signal<string | null>(null);
  created = signal<Farm | null>(null);

  form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    address:     ['', Validators.required],
    phone:       [''],
    description: [''],
    website:     [''],
  });

  onSubmit(): void {
    if (this.form.invalid || this.loading()) return;
    this.error.set(null);
    this.loading.set(true);

    const v = this.form.getRawValue();
    this.farmSvc.createFarm({
      name:        v.name!,
      address:     v.address!,
      phone:       v.phone       || undefined,
      description: v.description || undefined,
      website:     v.website     || undefined,
    }).subscribe({
      next: farm => {
        this.created.set(farm);
        this.auth.refreshUser().subscribe({
          next: () => {
            this.loading.set(false);
            this.router.navigate(['/profile']);
          },
          error: () => this.loading.set(false),
        });
      },
      error: err => {
        this.error.set(err?.error?.error ?? 'Failed to create farm');
        this.loading.set(false);
      },
    });
  }
}