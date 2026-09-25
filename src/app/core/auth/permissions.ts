import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const PERMISSIONS = {
  shop: ['Customer'],
  manageProducts: ['BusinessOwner', 'Worker'],
  manageProduction: ['BusinessOwner', 'Worker'],
  manageMaterials: ['BusinessOwner', 'Worker'],
  deleteBusinessData: ['BusinessOwner'],
  analytics: ['BusinessOwner', 'SystemAdmin'],
  manageOrders: ['BusinessOwner', 'Worker'],
  manageBusiness: ['BusinessOwner'],
  viewBusiness: ['BusinessOwner', 'Worker'],
  viewMaterials: ['BusinessOwner', 'Worker', 'SystemAdmin'],
} as const;
export type Permission = keyof typeof PERMISSIONS;
export function hasPermission(role: string | null, permission: Permission): boolean {
  return role !== null && (PERMISSIONS[permission] as readonly string[]).includes(role);
}
export const permissionGuard = (permission: Permission): CanActivateFn => () =>
  hasPermission(inject(AuthService).role(), permission) || inject(Router).createUrlTree(['/dashboard']);
