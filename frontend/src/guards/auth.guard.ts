import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  // FIX: Explicitly type `router` to resolve a potential type inference issue where it was being treated as 'unknown'.
  const router: Router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to the login page
  router.navigate(['/login']);
  return false;
};