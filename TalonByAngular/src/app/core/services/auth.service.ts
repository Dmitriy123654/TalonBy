import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, tap, catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface AuthResponse {
  authenticated: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<boolean>(false);
  public authState = this.currentUserSubject.asObservable();
  private initialAuthCheckComplete = false;
  
  constructor(private http: HttpClient) {
    // Check auth state on service initialization
    this.checkAuthState();
  }
  
  // Method to check authentication state on application startup
  private checkAuthState(): void {
    // Check for persisted auth state in localStorage first
    const persistedAuth = localStorage.getItem('auth_state');
    if (persistedAuth === 'true') {
      this.currentUserSubject.next(true);
    }
    
    // Then verify with the server
    this.getCurrentUser().subscribe({
      next: (response) => {
        if (response.authenticated) {
          this.currentUserSubject.next(true);
          localStorage.setItem('auth_state', 'true');
        } else {
          this.currentUserSubject.next(false);
          localStorage.removeItem('auth_state');
        }
        this.initialAuthCheckComplete = true;
      },
      error: () => {
        // If error and we had a persisted state, keep the user logged in
        // This helps if the server is temporarily unavailable
        if (persistedAuth !== 'true') {
          this.currentUserSubject.next(false);
          localStorage.removeItem('auth_state');
        }
        this.initialAuthCheckComplete = true;
      }
    });
  }

  login(email: string, password: string): Observable<void> {
    // Set headers to ensure no sensitive data returned in response
    const headers = new HttpHeaders({
      'X-No-Response-Body': 'true'
    });
    
    return this.http.post<void>(
      `${environment.apiUrl}/auth/login`,
      { email, password },
      { 
        withCredentials: true,
        headers
      }
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(true);
        localStorage.setItem('auth_state', 'true');
      })
    );
  }

  register(email: string, password: string, phone: string): Observable<any> {
    // Set headers to ensure no sensitive data returned in response
    const headers = new HttpHeaders({
      'X-No-Response-Body': 'true'
    });
    
    return this.http.post<any>(
      `${environment.apiUrl}/auth/register`, 
      { email, password, phone },
      { 
        withCredentials: true,
        headers
      }
    );
  }

  logout(): Observable<void> {
    // Set headers to ensure no sensitive data returned in response
    const headers = new HttpHeaders({
      'X-No-Response-Body': 'true'
    });
    
    return this.http.post<void>(
      `${environment.apiUrl}/auth/logout`,
      {},
      { 
        withCredentials: true,
        headers
      }
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(false);
        localStorage.removeItem('auth_state');
      }),
      catchError(error => {
        // Still update auth state to logged out even if server-side logout fails
        this.currentUserSubject.next(false);
        localStorage.removeItem('auth_state');
        return of(void 0); // Return an observable with void result
      })
    );
  }

  // Метод для проверки аутентификации
  checkAuth(): boolean {
    return this.currentUserSubject.value;
  }

  // Check if initial auth verification is complete
  isAuthCheckComplete(): boolean {
    return this.initialAuthCheckComplete;
  }

  // Метод для получения данных текущего пользователя
  getCurrentUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        if (response.authenticated) {
          this.currentUserSubject.next(true);
          localStorage.setItem('auth_state', 'true');
        } else {
          this.currentUserSubject.next(false);
          localStorage.removeItem('auth_state');
        }
      }),
      catchError(error => {
        // Only clear auth state if it's an auth error (401)
        if (error.status === 401) {
          this.currentUserSubject.next(false);
          localStorage.removeItem('auth_state');
        }
        throw error;
      })
    );
  }
} 