import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { UserLogin, UserRegistration } from '../../shared/interfaces/auth.interface';
import { RoleOfUser } from '../../shared/interfaces/user.interface';

export interface UserInfo {
  userId: string;
  email: string;
  role: string;
  phone?: string;
  exp?: number;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken?: string;
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  role?: string;
  message?: string;
  email?: string;
  userId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private tokenExpirationTimer: any;
  private router = inject(Router);
  private storageKeyPrefix = 'talonby_';
  
  // Добавляем время жизни кеша в миллисекундах (10 минут)
  private userCacheLifetime = 10 * 60 * 1000; 
  private lastUserFetch = 0;
  
  // Add BehaviorSubject for authentication state
  private _authState = new BehaviorSubject<boolean>(false);
  authState = this._authState.asObservable();
  
  // Add BehaviorSubject for user information
  private _userInfo = new BehaviorSubject<UserInfo | null>(null);
  userInfo = this._userInfo.asObservable();

  // Private flag to track refresh status
  private _isRefreshing = false;

  constructor(private http: HttpClient) {
    this.tryAutoLogin();
  }

  // Функция для декодирования JWT токена
  private decodeJwtToken(token: string): any {
    try {
      // Split the token into header, payload, and signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      
      // Decode the payload
      const payload = parts[1];
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      
      const parsed = JSON.parse(jsonPayload);
      
      // Handle arrays for claims (fix for duplicated claims)
      const normalizedClaims: any = {};
      Object.keys(parsed).forEach(key => {
        if (Array.isArray(parsed[key])) {
          // Take the first value of array claims
          normalizedClaims[key] = parsed[key][0];
        } else {
          normalizedClaims[key] = parsed[key];
        }
      });
      
      return normalizedClaims;
    } catch (e) {
      return null;
    }
  }

  // Обновление информации о пользователе из токена
  private updateUserInfoFromToken(token: string): UserInfo | null {
    // Decode the token
    const decodedToken = this.decodeJwtToken(token);
    if (!decodedToken) {
      return null;
    }
    
    // Extract user info from token, with proper fallbacks
    const userInfo: UserInfo = {
      userId: decodedToken.nameid || '',
      email: decodedToken.email || '',
      role: decodedToken.role || '',
      phone: decodedToken.Phone || ''
    };
    
    // Update expiration
    if (decodedToken.exp) {
      userInfo.exp = decodedToken.exp;
    }
    
    // Update subject
    this._userInfo.next(userInfo);
    
    // Save to localStorage for persistence
    localStorage.setItem(`${this.storageKeyPrefix}user_info`, JSON.stringify(userInfo));
    
    return userInfo;
  }

  // Автоматический вход пользователя при запуске приложения
  autoLogin(): void {
    const token = localStorage.getItem(`${this.storageKeyPrefix}token`);
    const refreshToken = localStorage.getItem(`${this.storageKeyPrefix}refreshToken`);
    
    if (!token) {
      return;
    }
    
    try {
      const decodedToken = this.decodeJwtToken(token);
      if (!decodedToken) {
        this.logout().subscribe();
        return;
      }
      
      // Проверяем срок действия токена
      const expirationDate = decodedToken.exp * 1000; // в миллисекундах
      const now = Date.now();
      
      // If token is about to expire (less than 5 minutes) and we have a refresh token
      if (expirationDate - now < 300000 && refreshToken) {
        // Try to refresh the token
        this.refreshToken(refreshToken).subscribe({
          next: () => {
            // Токен успешно обновлен
          },
          error: () => {
            this.logout().subscribe();
          }
        });
      } else if (now >= expirationDate) {
        this.logout().subscribe();
      } else {
        // Если токен действителен, обновляем информацию из него
        const userInfo = this.updateUserInfoFromToken(token);
        
        // Настраиваем автоматический выход по истечении токена
        if (userInfo && userInfo.exp) {
          const expiresIn = expirationDate - now;
          this.autoLogout(new Date(now + expiresIn));
          this._authState.next(true);
        }
      }
    } catch (error) {
      this.logout().subscribe();
    }
  }

  // Проверка токена на валидность (срок действия)
  private checkTokenValidity(): void {
    const token = localStorage.getItem(`${this.storageKeyPrefix}token`);
    
    if (!token) {
      this.logout().subscribe();
      return;
    }
    
    try {
      const decodedToken = this.decodeJwtToken(token);
      if (!decodedToken) {
        this.logout().subscribe();
        return;
      }
      
      // Проверяем срок действия токена
      const expirationDate = decodedToken.exp * 1000; // в миллисекундах
      if (Date.now() >= expirationDate) {
        this.logout().subscribe();
      } else {
        // Если токен действителен, обновляем информацию из него
        this.updateUserInfoFromToken(token);
      }
    } catch (error) {
      this.logout().subscribe();
    }
  }

  // Загрузка информации пользователя из localStorage
  private loadUserInfo(): UserInfo | null {
    const userInfoJson = localStorage.getItem(`${this.storageKeyPrefix}user_info`);
    
    if (userInfoJson) {
      try {
        return JSON.parse(userInfoJson);
      } catch (error) {
        return null;
      }
    }
    
    // Если нет сохраненных данных, но есть токен, пробуем извлечь информацию из него
    const token = localStorage.getItem(`${this.storageKeyPrefix}token`);
    if (token) {
      return this.updateUserInfoFromToken(token);
    }
    
    return null;
  }

  hasToken(): boolean {
    return !!localStorage.getItem(`${this.storageKeyPrefix}token`);
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/auth/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap(response => {
          if (response && response.token) {
            // Сохраняем JWT токен
            localStorage.setItem(`${this.storageKeyPrefix}token`, response.token);
            
            // Сохраняем refresh токен, если он есть
            if (response.refreshToken) {
              localStorage.setItem(`${this.storageKeyPrefix}refreshToken`, response.refreshToken);
            }
            
            // Устанавливаем auth state
            localStorage.setItem(`${this.storageKeyPrefix}auth_state`, 'true');
            this._authState.next(true);
            
            // Сначала пробуем извлечь информацию из токена
            let userInfo = this.updateUserInfoFromToken(response.token);
            
            // Если по какой-то причине не смогли получить данные из токена, создаем минимальную информацию
            if (!userInfo && response.role) {
              userInfo = {
                userId: '0', // Временный ID, будет обновлен при первом запросе me
                email: email,
                role: response.role,
                phone: ''
              };
              
              // Сохраняем минимальную информацию
              this._userInfo.next(userInfo);
              localStorage.setItem(`${this.storageKeyPrefix}user_info`, JSON.stringify(userInfo));
            }
            
            // Для обеспечения полной информации делаем запрос me
            this.getCurrentUser().subscribe({
              error: () => {}
            });
          }
        }),
        catchError(error => {
          return throwError(() => error);
        })
      );
  }

  register(userData: UserRegistration): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  logout(): Observable<void> {
    // Получаем refresh токен для отзыва на сервере
    const refreshToken = localStorage.getItem(`${this.storageKeyPrefix}refreshToken`);
    
    // Clear local storage first - чтобы предотвратить повторные запросы при ошибках
    localStorage.removeItem(`${this.storageKeyPrefix}token`);
    localStorage.removeItem(`${this.storageKeyPrefix}refreshToken`);
    localStorage.removeItem(`${this.storageKeyPrefix}expirationDate`);
    localStorage.removeItem(`${this.storageKeyPrefix}auth_state`);
    localStorage.removeItem(`${this.storageKeyPrefix}user_info`);
    localStorage.removeItem(`${this.storageKeyPrefix}lastUserFetch`);
    
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }
    
    // Reset user info and auth state immediately
    this._authState.next(false);
    this._userInfo.next(null);
    this.lastUserFetch = 0;
    
    // Logout на сервере
    if (refreshToken) {
      // Если есть refreshToken, отправляем его
      return this.http.post<void>(
        `${this.apiUrl}/auth/logout`, 
        { refreshToken }, 
        { withCredentials: true }
      ).pipe(
        tap(() => {
          this.router.navigate(['/login']);
        }),
        catchError(() => {
          // Even if server logout fails, still navigate to login
          this.router.navigate(['/login']);
          return of(void 0);
        })
      );
    } else {
      // Если нет refreshToken, просто перенаправляем на логин
      this.router.navigate(['/login']);
      return of(void 0);
    }
  }

  refreshToken(refreshToken: string): Observable<RefreshTokenResponse> {
    return this.http.post<RefreshTokenResponse>(
      `${this.apiUrl}/auth/refresh-token`, 
      { refreshToken }
    ).pipe(
      tap(response => {
        if (response && response.token) {
          // Сохраняем новый JWT токен
          localStorage.setItem(`${this.storageKeyPrefix}token`, response.token);
          
          // Сохраняем новый refresh токен, если он есть
          if (response.refreshToken) {
            localStorage.setItem(`${this.storageKeyPrefix}refreshToken`, response.refreshToken);
          }
          
          // Обновляем информацию пользователя из токена
          this.updateUserInfoFromToken(response.token);
          
          // Устанавливаем auth state
          localStorage.setItem(`${this.storageKeyPrefix}auth_state`, 'true');
          this._authState.next(true);
        }
      }),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  // Обновить информацию о пользователе с сервера
  getCurrentUser(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      tap(response => {
        // Update auth state based on response - now simplified 
        const isAuthenticated = response && response.authenticated === true;
        
        if (isAuthenticated) {
          this._authState.next(true);
          localStorage.setItem(`${this.storageKeyPrefix}auth_state`, 'true');
          
          // Since /me now only returns {authenticated: true}, we need to rely on the token
          // Get user info from token if available
          const token = this.getToken();
          if (token) {
            this.updateUserInfoFromToken(token);
          }
        } else {
          this._authState.next(false);
          localStorage.removeItem(`${this.storageKeyPrefix}auth_state`);
          localStorage.removeItem(`${this.storageKeyPrefix}user_info`);
          this._userInfo.next(null);
        }
      }),
      catchError(() => {
        return of({ authenticated: false });
      })
    );
  }

  getUserInfo(): UserInfo | null {
    return this._userInfo.value;
  }

  // Проверка является ли пользователь администратором
  isAdmin(): boolean {
    const userInfo = this.getUserInfo();
    return !!userInfo && ['Administrator', 'ChiefDoctor'].includes(userInfo.role || '');
  }

  // Проверка на разрешение доступа к админке (более широкий список ролей)
  hasAdminAccess(): boolean {
    const userInfo = this.getUserInfo();
    
    if (!userInfo || !userInfo.role) {
      return false;
    }
    
    return userInfo.role !== 'Patient';
  }

  public handleAuthentication(token: string) {
    localStorage.setItem(`${this.storageKeyPrefix}token`, token);
    
    try {
      const decodedToken: any = jwtDecode(token);
      const expirationDate = new Date(decodedToken.exp * 1000);
      localStorage.setItem(`${this.storageKeyPrefix}expirationDate`, expirationDate.toISOString());
      
      // Set authentication state to true
      localStorage.setItem(`${this.storageKeyPrefix}auth_state`, 'true');
      this._authState.next(true);
      
      this.autoLogout(expirationDate);
      
      // Update user info
      this.getCurrentUser().subscribe();
    } catch (error) {
      this.logout().subscribe();
    }
  }

  autoLogout(expirationDate: Date) {
    const expiresIn = expirationDate.getTime() - new Date().getTime();
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout().subscribe();
    }, expiresIn);
  }

  getToken(): string | null {
    return localStorage.getItem(`${this.storageKeyPrefix}token`);
  }

  isAuthenticated(): boolean {
    // Проверяем наличие auth_state в localStorage
    const authState = localStorage.getItem(`${this.storageKeyPrefix}auth_state`);
    
    // Проверяем наличие токена
    const token = this.getToken();
    
    // Аутентифицирован только если есть и токен, и auth_state = true
    if (authState !== 'true' || !token) {
      return false;
    }
    
    try {
      // Проверяем, не истек ли срок действия токена
      const decodedToken = this.decodeJwtToken(token);
      if (!decodedToken || !decodedToken.exp) {
        return false;
      }
      
      const expirationTime = decodedToken.exp * 1000; // в миллисекундах
      const now = Date.now();
      
      return now < expirationTime;
    } catch (error) {
      return false;
    }
  }

  hasDoctorRole(): boolean {
    const userInfo = this.getUserInfo();
    if (!userInfo) return false;
    
    return userInfo.role === RoleOfUser.Doctor || 
           userInfo.role === RoleOfUser.ChiefDoctor || 
           userInfo.role === RoleOfUser.MedicalStaff;
  }

  private tryAutoLogin() {
    const authState = localStorage.getItem(`${this.storageKeyPrefix}auth_state`);
    const userInfoJson = localStorage.getItem(`${this.storageKeyPrefix}user_info`);
    const lastFetch = localStorage.getItem(`${this.storageKeyPrefix}lastUserFetch`);
    
    // Восстанавливаем время последнего запроса из localStorage
    if (lastFetch) {
      this.lastUserFetch = parseInt(lastFetch, 10);
    }
    
    // If auth state is true, the auth_token cookie should be present
    if (authState === 'true' && userInfoJson) {
      try {
        // Установим локальные данные из localStorage
        const savedUserInfo = JSON.parse(userInfoJson);
        this._userInfo.next(savedUserInfo);
        this._authState.next(true);
        
        // Проверяем, не истек ли кеш
        const now = Date.now();
        const cacheExpired = now - this.lastUserFetch > this.userCacheLifetime;
        
        // Обновляем данные с сервера в фоне, если кеш истек
        if (cacheExpired) {
          this.getCurrentUser().subscribe();
        }
      } catch (error) {
        // Если есть ошибка с локальными данными, принудительно обновляем с сервера
        this.getCurrentUser().subscribe();
      }
    }
  }

  // Enhanced refreshUserData method to ensure we always get fresh data without triggering auth state changes
  refreshUserData(): Observable<any> {
    // Use a flag to track if we're already refreshing
    if (this._isRefreshing) {
      return of(this._userInfo.value);
    }
    
    this._isRefreshing = true;
    
    // Get fresh token data from server without triggering auth state changes
    return this.http.get<any>(`${this.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      map(response => {
        const isAuthenticated = response && response.authenticated === true;
        
        if (isAuthenticated) {
          // Extract user data from token, don't update auth state
          const token = this.getToken();
          if (token) {
            const userInfo = this.updateUserInfoFromToken(token);
            this._isRefreshing = false;
            return userInfo;
          }
        }
        
        this._isRefreshing = false;
        return this._userInfo.value;
      }),
      catchError(() => {
        this._isRefreshing = false;
        return of(this._userInfo.value);
      })
    );
  }

  // Add method to get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(`${this.storageKeyPrefix}refreshToken`);
  }
}