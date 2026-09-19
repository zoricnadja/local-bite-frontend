import { permissionGuard } from '../../core/auth/permissions';
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const FARM_ROUTES: Routes = [
  {
    path: 'create', canActivate: [permissionGuard('manageFarm')],
    loadComponent: () => import('./create/create-farm.component').then(m => m.CreateFarmComponent),
  },
  {
    path: 'workers', canActivate: [permissionGuard('manageFarm')],
    loadComponent: () => import('./workers/workers-list.component').then(m => m.WorkersListComponent),
  },
  {
    path: 'workers/add', canActivate: [permissionGuard('manageFarm')],
    loadComponent: () => import('./workers/add-worker.component').then(m => m.AddWorkerComponent),
  },
  { path: '', redirectTo: 'workers', pathMatch: 'full' },
];
