import { permissionGuard } from '../../core/auth/permissions';
import { Routes } from '@angular/router';

export const RAW_MATERIALS_ROUTES: Routes = [
  {
    path: '', canActivate: [permissionGuard('viewMaterials')],
    loadComponent: () =>
      import('./list/raw-materials-list.component').then(m => m.RawMaterialsListComponent),
  },
  {
    path: 'new', canActivate: [permissionGuard('manageMaterials')],
    loadComponent: () =>
      import('./form/raw-material-form.component').then(m => m.RawMaterialFormComponent),
  },
  {
    path: ':id/edit', canActivate: [permissionGuard('manageMaterials')],
    loadComponent: () =>
      import('./form/raw-material-form.component').then(m => m.RawMaterialFormComponent),
  },
];
