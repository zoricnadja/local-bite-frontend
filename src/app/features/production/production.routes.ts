import { Routes } from '@angular/router';

export const PRODUCTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/production-list.component').then(m => m.ProductionListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./form/production-form.component').then(m => m.ProductionFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/production-detail.component').then(m => m.ProductionDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./form/production-form.component').then(m => m.ProductionFormComponent),
  },
];
