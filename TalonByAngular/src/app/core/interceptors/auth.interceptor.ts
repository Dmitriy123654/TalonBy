import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Clone the request to ensure it's immutable
  let modifiedReq = req;

  // Add withCredentials for all API requests
  if (req.url.startsWith(environment.apiUrl)) {
    modifiedReq = req.clone({
      withCredentials: true
    });
  }

  // Add header to prevent sensitive data in responses for auth endpoints
  if (req.url.includes('/auth/')) {
    modifiedReq = modifiedReq.clone({
      headers: modifiedReq.headers.set('X-No-Response-Body', 'true')
    });
  }

  return next(modifiedReq).pipe(
    // Remove any sensitive data from response if needed
    tap(event => {
      // Check if the event is an HttpResponse and has a body property
      if (event instanceof HttpResponse && event.body) {
        const body = event.body as any;
        // Delete token from response body if it somehow gets returned
        if (body && body.token) {
          delete body.token;
        }
      }
    }),
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors except for auth endpoints
      if (error.status === 401) {
        // Skip for auth endpoints to avoid redirect loops
        const isAuthEndpoint = req.url.includes('/auth/');
        const isLogoutRequest = req.url.includes('/auth/logout');
        
        // Don't redirect for logout requests or if we're already at the login page
        if (!isLogoutRequest && !isAuthEndpoint && router.url !== '/login') {
          // If we get a 401, we need to logout and redirect to login
          authService.logout().subscribe(() => {
            router.navigate(['/login']);
          });
        }
      }
      
      return throwError(() => error);
    })
  );
};