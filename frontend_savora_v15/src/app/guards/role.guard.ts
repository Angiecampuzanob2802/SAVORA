import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '../core/session.service';

/** Impide acceder a rutas internas cuando no existe una sesión. */
export const authGuard: CanActivateFn = () => {
  const session = inject(SessionService);
  const router = inject(Router);

  if (session.user()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};

/** Crea un guard que admite únicamente los roles proporcionados. */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return () => {
    const session = inject(SessionService);
    const router = inject(Router);

    if (!session.user()) {
      return router.createUrlTree(['/login']);
    }

    if (session.hasRole(allowedRoles)) {
      return true;
    }

    return router.createUrlTree([session.redirectPathForRole()]);
  };
};
