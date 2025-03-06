import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
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
  
  constructor(private http: HttpClient) {
    this.getCurrentUser().subscribe({
      error: () => this.currentUserSubject.next(false)
    });
  }

  login(email: string, password: string): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/auth/login`,
      { email, password },
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(true);
      })
    );
  }

  register(email: string, password: string, phone: string): Observable<any> {
    return this.http.post<any>(
      `${environment.apiUrl}/auth/register`, 
      { email, password, phone },
      { withCredentials: true }
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(
      `${environment.apiUrl}/auth/logout`,
      {},
      { withCredentials: true }
    ).pipe(
      tap(() => {
        this.currentUserSubject.next(false);
      })
    );
  }

  // Метод для проверки аутентификации
  checkAuth(): boolean {
    return this.currentUserSubject.value;
  }

  // Метод для получения данных текущего пользователя
  getCurrentUser(): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(
      `${environment.apiUrl}/auth/me`,
      { withCredentials: true }
    ).pipe(
      tap(response => {
        this.currentUserSubject.next(response.authenticated);
      })
    );
  }
} 