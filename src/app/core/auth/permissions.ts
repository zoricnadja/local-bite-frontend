import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const PERMISSIONS = {
  shop: ['Customer'],
  manageProducts: ['FarmOwner', 'Worker'],
  manageProduction: ['FarmOwner', 'Worker'],
  manageMaterials: ['FarmOwner', 'Worker'],
  deleteFarmData: ['FarmOwner'],
  analytics: ['FarmOwner', 'SystemAdmin'],
  manageOrders: ['FarmOwner', 'Worker'],
  manageFarm: ['FarmOwner'],
  viewFarm: ['FarmOwner', 'Worker'],
  viewMaterials: ['FarmOwner', 'Worker', 'SystemAdmin'],
} as const;
export type Permission = keyof typeof PERMISSIONS;
export function hasPermission(role: string | null, permission: Permission): boolean {
  return role !== null && (PERMISSIONS[permission] as readonly string[]).includes(role);
}
export const permissionGuard = (permission: Permission): CanActivateFn => () =>
  hasPermission(inject(AuthService).role(), permission) || inject(Router).createUrlTree(['/dashboard']);
