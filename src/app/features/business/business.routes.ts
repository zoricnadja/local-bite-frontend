import { permissionGuard } from '../../core/auth/permissions';
import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const BUSINESS_ROUTES: Routes = [
  {
    path: 'create', canActivate: [permissionGuard('manageBusiness')],
    loadComponent: () => import('./create/create-business.component').then(m => m.CreateBusinessComponent),
  },
  {
    path: 'workers', canActivate: [permissionGuard('manageBusiness')],
    loadComponent: () => import('./workers/workers-list.component').then(m => m.WorkersListComponent),
  },
  {
    path: 'workers/add', canActivate: [permissionGuard('manageBusiness')],
    loadComponent: () => import('./workers/add-worker.component').then(m => m.AddWorkerComponent),
  },
  { path: '', redirectTo: 'workers', pathMatch: 'full' },
];
