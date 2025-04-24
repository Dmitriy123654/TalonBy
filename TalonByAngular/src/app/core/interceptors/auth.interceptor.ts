import { HttpInterceptorFn, HttpResponse, HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, tap, switchMap } from 'rxjs/operators';
import { Observable, throwError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip token for auth endpoints except for refresh and me endpoints
  const isAuthEndpoint = req.url.includes('/auth/');
  const isLoginOrRegister = req.url.includes('/auth/login') || req.url.includes('/auth/register');
  
  // Clone the request to ensure it's immutable
  let modifiedReq = req;

  // Add Bearer token for API requests that need authentication
  if (req.url.startsWith(environment.apiUrl) && (!isAuthEndpoint || !isLoginOrRegister)) {
    const token = authService.getToken();
    
    if (token) {
      modifiedReq = req.clone({
        withCredentials: true,
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    } else {
      // If no token but endpoint requires it, add withCredentials only
      modifiedReq = req.clone({
        withCredentials: true
      });
    }
  } else if (req.url.startsWith(environment.apiUrl)) {
    // Always use withCredentials for API requests even without token
    modifiedReq = req.clone({
      withCredentials: true
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors except for auth endpoints
      if (error.status === 401) {
        // Skip for auth endpoints to avoid redirect loops
        const isAuthEndpoint = req.url.includes('/auth/');
        const isLogoutRequest = req.url.includes('/auth/logout');
        
        // Don't redirect for logout requests or if we're already at the login page
        if (!isLogoutRequest && !isAuthEndpoint && router.url !== '/login') {
          // If we get a 401, we need to logout and redirect to login
          authService.logout().subscribe({
            next: () => {
              router.navigate(['/login']);
            },
            error: () => {
              router.navigate(['/login']);
            }
          });
        }
      }
      
      return throwError(() => error);
    })
  );
};