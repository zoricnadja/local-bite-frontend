import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/products-list.component').then(m => m.ProductsListComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./form/product-form.component').then(m => m.ProductFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./form/product-form.component').then(m => m.ProductFormComponent),
  },
];
