import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

const STORAGE_KEY_PREFIX = 'talonby_';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Check localStorage first for immediate decision
  const persistedAuth = localStorage.getItem(`${STORAGE_KEY_PREFIX}auth_state`);
  if (persistedAuth === 'true') {
    // Просто разрешаем доступ без вызова API
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