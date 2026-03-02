import { Routes } from '@angular/router';

export const ORDERS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./list/orders-list.component').then(m => m.OrdersListComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./analytics/orders-analytics.component').then(m => m.OrdersAnalyticsComponent),
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./form/order-form.component').then(m => m.OrderFormComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/order-detail.component').then(m => m.OrderDetailComponent),
  },
];
