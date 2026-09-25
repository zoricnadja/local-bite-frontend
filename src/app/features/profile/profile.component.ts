import { requiredText, websiteUrl } from '../../shared/form-validators';
import { FieldErrorsDirective } from '../../shared/field-errors.directive';
import { CanDirective } from '../../core/auth/can.directive';
import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import {Business, UpdateUserRequest, UpdateBusinessRequest} from '../../shared/models/auth.models';
import {UserService} from "../../core/services/users.service";
import {BusinessService} from "../../core/services/business.service";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [FieldErrorsDirective, CanDirective, CommonModule, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  private auth    = inject(AuthService);
  private userSvc = inject(UserService);
  private businessSvc = inject(BusinessService);
  private fb      = inject(FormBuilder);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly currentUser = this.auth.currentUser;
  businessId      = this.auth.businessId;

  business         = signal<Business | null>(null);
  businessLoading  = signal(false);
  businessError    = signal<string | null>(null);

  // edit modes
  editingUser  = signal(false);
  editingBusiness  = signal(false);

  // async feedback
  userSaving   = signal(false);
  userError    = signal<string | null>(null);
  businessSaving   = signal(false);
  businessSaveError = signal<string | null>(null);

  // delete confirm
  confirmDeleteUser = signal(false);
  confirmDeleteBusiness = signal(false);
  deleting          = signal(false);
  deleteError       = signal<string | null>(null);

  // ── Forms ──────────────────────────────────────────────────────────────────
  userForm = this.fb.group({
    first_name:    ['', requiredText],
    last_name:     ['', requiredText],
    email:         ['', [Validators.required, Validators.email]],
    address:       ['', requiredText],
    phone:         [''],
    date_of_birth: [''],
  });

  businessForm = this.fb.group({
    name:        ['', requiredText],
    address:     ['', requiredText],
    phone:       [''],
    description: [''],
    website:     ['', websiteUrl],
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  initials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
  });

  // ── Load business when businessId changes ──────────────────────────────────────────
  private _businessEffect = effect(() => {
    const id = this.businessId();
    this.businessError.set(null);
    if (this.auth.isCustomer() || !id) { this.business.set(null); return; }
    this.businessLoading.set(true);
    this.businessSvc.getById(id).subscribe({
      next:  f  => { this.business.set(f.data); this.businessLoading.set(false); },
      error: err => { this.businessError.set(err?.error?.error ?? 'Failed to load business'); this.businessLoading.set(false); },
    });
  });

  // ── User edit ──────────────────────────────────────────────────────────────
  startEditUser() {
    const u = this.currentUser()!;
    this.userForm.setValue({
      first_name:    u.first_name,
      last_name:     u.last_name,
      email:         u.email,
      address:       u.address,
      phone:         u.phone ?? '',
      date_of_birth: u.date_of_birth ?? '',
    });
    this.userError.set(null);
    this.editingUser.set(true);
  }

  cancelEditUser() { this.editingUser.set(false); }

  saveUser() {
    if (this.userForm.invalid) { this.userForm.markAllAsTouched(); return; }
    this.userSaving.set(true);
    this.userError.set(null);

    const v = this.userForm.getRawValue();
    const req: UpdateUserRequest = {
      first_name:    v.first_name!,
      last_name:     v.last_name!,
      email:         v.email!,
      address:       v.address!,
      phone:         v.phone         || undefined,
      date_of_birth: v.date_of_birth || undefined,
    };

    this.userSvc.update(this.currentUser()!.id, req).subscribe({
      next: updated => {
        
        this.auth.setToken(this.auth.token()!); // keep token fresh in storage
        this.auth['setUser'](updated.data);           // update signal
        this.editingUser.set(false);
        this.userSaving.set(false);
      },
      error: err => {
        this.userError.set(err?.error?.error ?? 'Failed to save profile');
        this.userSaving.set(false);
      },
    });
  }

  // ── Business edit ──────────────────────────────────────────────────────────────
  startEditBusiness() {
    const f = this.business()!;
    this.businessForm.setValue({
      name:        f.name,
      address:     f.address,
      phone:       f.phone       ?? '',
      description: f.description ?? '',
      website:     f.website     ?? '',
    });
    this.businessSaveError.set(null);
    this.editingBusiness.set(true);
  }

  cancelEditBusiness() { this.editingBusiness.set(false); }

  saveBusiness() {
    if (this.businessForm.invalid) { this.businessForm.markAllAsTouched(); return; }
    this.businessSaving.set(true);
    this.businessSaveError.set(null);

    const v = this.businessForm.getRawValue();
    const req: UpdateBusinessRequest = {
      name:        v.name!,
      address:     v.address!,
      phone:       v.phone       || undefined,
      description: v.description || undefined,
      website:     v.website     || undefined,
    };

    this.businessSvc.update(this.businessId()!, req).subscribe({
      next: updated => {
        this.business.set(updated.data);
        this.editingBusiness.set(false);
        this.businessSaving.set(false);
      },
      error: err => {
        this.businessSaveError.set(err?.error?.error ?? 'Failed to save business');
        this.businessSaving.set(false);
      },
    });
  }

  // ── Delete user ────────────────────────────────────────────────────────────
  deleteUser() {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.userSvc.delete(this.currentUser()!.id).subscribe({
      next:  () => this.auth.logout(),
      error: err => {
        this.deleteError.set(err?.error?.error ?? 'Failed to delete account');
        this.deleting.set(false);
        this.confirmDeleteUser.set(false);
      },
    });
  }

  // ── Delete business ────────────────────────────────────────────────────────────
  deleteBusiness() {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.businessSvc.delete(this.businessId()!).subscribe({
      next: () => {
        this.business.set(null);
        // this.auth.businessId.set(null);
        this.confirmDeleteBusiness.set(false);
        this.deleting.set(false);
        this.auth.refreshUser().subscribe(); // re-sync token/user (business_id cleared)
      },
      error: err => {
        this.deleteError.set(err?.error?.error ?? 'Failed to delete business');
        this.deleting.set(false);
        this.confirmDeleteBusiness.set(false);
      },
    });
  }
}
