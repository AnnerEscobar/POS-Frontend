import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';

export const authGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);

  if (!state.isAuthenticated()) {
    router.navigateByUrl('/login');
    return false;
  }

  return true;
};
