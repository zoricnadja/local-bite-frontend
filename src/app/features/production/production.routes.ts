import { permissionGuard } from '../../core/auth/permissions';
import { Routes } from '@angular/router';

export const PRODUCTION_ROUTES: Routes = [
  {
    path: '', canActivate: [permissionGuard('manageProduction')],
    loadComponent: () =>
      import('./list/production-list.component').then(m => m.ProductionListComponent),
  },
  {
    path: 'new', canActivate: [permissionGuard('manageProduction')],
    loadComponent: () =>
      import('./form/production-form.component').then(m => m.ProductionFormComponent),
  },
  {
    path: ':id', canActivate: [permissionGuard('manageProduction')],
    loadComponent: () =>
      import('./detail/production-detail.component').then(m => m.ProductionDetailComponent),
  },
  {
    path: ':id/edit', canActivate: [permissionGuard('manageProduction')],
    loadComponent: () =>
      import('./form/production-form.component').then(m => m.ProductionFormComponent),
  },
];
