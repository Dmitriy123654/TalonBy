import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth/login`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<any> {
    const loginData = { email, password };
    return this.http.post<any>(`${this.apiUrl}`, loginData);
  }

  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  saveRoles(roles: string[]): void {
    localStorage.setItem('roles', JSON.stringify(roles));
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRoles(): string[] | null {
    const rolesString = localStorage.getItem('roles');
    return rolesString ? JSON.parse(rolesString) : null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    return token !== null;
  }
} 