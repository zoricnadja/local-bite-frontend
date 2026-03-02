import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/auth.guard';

export const FARM_ROUTES: Routes = [
  {
    path: 'create',
    canActivate: [authGuard],
    loadComponent: () => import('./create/create-farm.component').then(m => m.CreateFarmComponent),
  },
  {
    path: 'workers/add',
    canActivate: [authGuard],
    loadComponent: () => import('./workers/add-worker.component').then(m => m.AddWorkerComponent),
  },
  { path: '', redirectTo: 'create', pathMatch: 'full' },
];
