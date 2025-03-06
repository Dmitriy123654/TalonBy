import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient) {
    // Проверяем наличие данных пользователя при инициализации
    const userData = localStorage.getItem('user');
    if (userData) {
      this.currentUserSubject.next(JSON.parse(userData));
    }
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(response => {
          // Сохраняем данные пользователя в localStorage
          this.setUserData(response);
        })
      );
  }

  register(email: string, password: string, phone: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, {
      email,
      password,
      phone
    });
  }

  logout(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/auth/logout`, {})
      .pipe(
        tap(() => {
          // Очищаем только данные пользователя
          this.clearUserData();
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  private setUserData(response: any): void {
    // Сохраняем данные пользователя (без токена)
    const userData = {
      userId: response.userId,
      email: response.email,
      role: response.role
    };
    localStorage.setItem('user', JSON.stringify(userData));
    this.currentUserSubject.next(userData);
  }

  public clearUserData(): void {
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }
} 