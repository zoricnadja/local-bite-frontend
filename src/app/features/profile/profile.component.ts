import { Component, inject, signal, effect, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import {Farm, UpdateUserRequest, UpdateFarmRequest} from '../../shared/models/auth.models';
import {UserService} from "../../core/services/users.service";
import {FarmService} from "../../core/services/farm.service";

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent {
  private auth    = inject(AuthService);
  private userSvc = inject(UserService);
  private farmSvc = inject(FarmService);
  private fb      = inject(FormBuilder);

  // ── State ──────────────────────────────────────────────────────────────────
  readonly currentUser = this.auth.currentUser;
  farmId      = this.auth.farmId;

  farm         = signal<Farm | null>(null);
  farmLoading  = signal(false);
  farmError    = signal<string | null>(null);

  // edit modes
  editingUser  = signal(false);
  editingFarm  = signal(false);

  // async feedback
  userSaving   = signal(false);
  userError    = signal<string | null>(null);
  farmSaving   = signal(false);
  farmSaveError = signal<string | null>(null);

  // delete confirm
  confirmDeleteUser = signal(false);
  confirmDeleteFarm = signal(false);
  deleting          = signal(false);
  deleteError       = signal<string | null>(null);

  // ── Forms ──────────────────────────────────────────────────────────────────
  userForm = this.fb.group({
    first_name:    ['', Validators.required],
    last_name:     ['', Validators.required],
    email:         ['', [Validators.required, Validators.email]],
    address:       ['', Validators.required],
    phone:         [''],
    date_of_birth: [''],
  });

  farmForm = this.fb.group({
    name:        ['', Validators.required],
    address:     ['', Validators.required],
    phone:       [''],
    description: [''],
    website:     [''],
  });

  // ── Derived ────────────────────────────────────────────────────────────────
  initials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
  });

  // ── Load farm when farmId changes ──────────────────────────────────────────
  private _farmEffect = effect(() => {
    const id = this.farmId();
    if (!id) { this.farm.set(null); return; }
    this.farmLoading.set(true);
    this.farmSvc.getById(id).subscribe({
      next:  f  => { this.farm.set(f.data); this.farmLoading.set(false); },
      error: err => { this.farmError.set(err?.error?.error ?? 'Failed to load farm'); this.farmLoading.set(false); },
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
    if (this.userForm.invalid) return;
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
        console.log(updated)
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

  // ── Farm edit ──────────────────────────────────────────────────────────────
  startEditFarm() {
    const f = this.farm()!;
    this.farmForm.setValue({
      name:        f.name,
      address:     f.address,
      phone:       f.phone       ?? '',
      description: f.description ?? '',
      website:     f.website     ?? '',
    });
    this.farmSaveError.set(null);
    this.editingFarm.set(true);
  }

  cancelEditFarm() { this.editingFarm.set(false); }

  saveFarm() {
    if (this.farmForm.invalid) return;
    this.farmSaving.set(true);
    this.farmSaveError.set(null);

    const v = this.farmForm.getRawValue();
    const req: UpdateFarmRequest = {
      name:        v.name!,
      address:     v.address!,
      phone:       v.phone       || undefined,
      description: v.description || undefined,
      website:     v.website     || undefined,
    };

    this.farmSvc.update(this.farmId()!, req).subscribe({
      next: updated => {
        this.farm.set(updated.data);
        this.editingFarm.set(false);
        this.farmSaving.set(false);
      },
      error: err => {
        this.farmSaveError.set(err?.error?.error ?? 'Failed to save farm');
        this.farmSaving.set(false);
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

  // ── Delete farm ────────────────────────────────────────────────────────────
  deleteFarm() {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.farmSvc.delete(this.farmId()!).subscribe({
      next: () => {
        this.farm.set(null);
        // this.auth.farmId.set(null);
        this.confirmDeleteFarm.set(false);
        this.deleting.set(false);
        this.auth.refreshUser().subscribe(); // re-sync token/user (farm_id cleared)
      },
      error: err => {
        this.deleteError.set(err?.error?.error ?? 'Failed to delete farm');
        this.deleting.set(false);
        this.confirmDeleteFarm.set(false);
      },
    });
  }
}