import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { map, switchMap, take, catchError, of } from 'rxjs';
import { RoleOfUser } from '../../shared/interfaces/user.interface';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Get user info from cache/token
  const userInfo = authService.getUserInfo();
  
  // If we already have user info with role, use it
  if (userInfo && userInfo.role) {
    console.log('roleGuard: checking role from cache/token');
    console.log('roleGuard: User role:', userInfo.role);
    
    // Check role
    if (allowedRoles.includes(userInfo.role)) {
      return true;
    }
    
    console.error('roleGuard: Access denied (cache/token), redirecting to main');
    router.navigate(['/main']);
    return false;
  }
  
  // If no cached data, check authentication status and then use token
  return authService.getCurrentUser().pipe(
    take(1),
    map(response => {
      if (!response || (response.authenticated === false)) {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }
      
      // Now we need to check the token again since /me only returns authenticated=true
      const updatedUserInfo = authService.getUserInfo();
      
      if (!updatedUserInfo || !updatedUserInfo.role) {
        console.error('roleGuard: No role information available');
        router.navigate(['/main']);
        return false;
      }
      
      console.log('roleGuard: checking role after authentication');
      console.log('roleGuard: User role:', updatedUserInfo.role);
      
      // Check role
      if (allowedRoles.includes(updatedUserInfo.role)) {
        return true;
      }
      
      console.error('roleGuard: Access denied, redirecting to main');
      router.navigate(['/main']);
      return false;
    }),
    catchError(error => {
      console.error('Error in roleGuard:', error);
      router.navigate(['/main']);
      return of(false);
    })
  );
};

// Специальный guard для проверки только роли администратора
export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // Используем hasAdminAccess для унифицированной проверки
  if (authService.hasAdminAccess()) {
    return true;
  }
  
  // Получаем информацию о пользователе из кэша
  const userInfo = authService.getUserInfo();
  
  // Если в кэше уже есть данные о роли, используем их
  if (userInfo && userInfo.role) {
    if (userInfo.role !== 'Patient') {
      return true;
    }
    
    console.error('adminGuard: Access denied, Patient role cannot access admin panel (cache check)');
    router.navigate(['/main']);
    return false;
  }
  
  // Если в кэше нет информации, только тогда проверяем с сервера
  return authService.getCurrentUser().pipe(
    take(1),
    map(response => {
      if (response && response.role && response.role !== 'Patient') {
        return true;
      }
      
      console.error('adminGuard: Access denied, role cannot access admin panel (API check)');
      router.navigate(['/main']);
      return false;
    }),
    catchError(error => {
      console.error('Error in adminGuard:', error);
      router.navigate(['/main']);
      return of(false);
    })
  );
}; 