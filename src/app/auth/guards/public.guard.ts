import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

export const PublicGuard: CanActivateFn = () => {
  const state = inject(AuthStateService);
  const router = inject(Router);
  if (state.isAuthenticated()) {
    router.navigate(['/']);
    return false;
  }
  return true;
};
