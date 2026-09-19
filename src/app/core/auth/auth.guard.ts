import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, map, of } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (auth.isLoggedIn()) return auth.refreshUser().pipe(
    map(() => true),
    catchError(() => of(router.createUrlTree(['/auth/login'])))
  );

  router.navigate(['/auth/login']);
  return false;
};
