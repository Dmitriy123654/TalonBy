import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Check localStorage first for immediate decision
  const persistedAuth = localStorage.getItem('auth_state');
  if (persistedAuth === 'true') {
    // Allow navigation while verifying with server in the background
    authService.getCurrentUser().subscribe(); // Refresh auth state in background
    return true;
  }
  
  // Otherwise, wait for authState observable
  return authService.authState.pipe(
    take(1),
    map(authenticated => {
      if (authenticated) {
        return true;
      }
      
      // Save URL to return after login
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }),
    catchError(() => {
      // On error, redirect to login page
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return of(false);
    })
  );
}; 