import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const RoleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const required = (route.data?.['roles'] as string[]) || [];
  const auth = inject(AuthService);
  const router = inject(Router);
  if (required.length === 0) return true;
  const ok = auth.hasAnyRole(required);
  if (!ok) {
    router.navigate(['/login']);
  }
  return ok;
};
