import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Добавляем withCredentials для всех запросов к нашему API
  if (req.url.startsWith(environment.apiUrl)) {
    req = req.clone({
      withCredentials: true
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        authService.logout().subscribe(() => {
          router.navigate(['/login']);
        });
      }
      return throwError(() => error);
    })
  );
};