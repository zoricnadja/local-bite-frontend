import { Routes } from '@angular/router';

export const RAW_MATERIALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/raw-materials-list.component').then(m => m.RawMaterialsListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./form/raw-material-form.component').then(m => m.RawMaterialFormComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./form/raw-material-form.component').then(m => m.RawMaterialFormComponent),
  },
];
