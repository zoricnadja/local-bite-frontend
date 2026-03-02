import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../../shared/models/auth.models';

export const roleGuard = (allowed: UserRole[]): CanActivateFn => () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  const role   = auth.role();

  if (role && allowed.includes(role)) return true;

  router.navigate(['/dashboard']);
  return false;
};
