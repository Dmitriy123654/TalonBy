import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Запрос на отправку кода
  sendVerificationCode(contact: string, type: 'email' | 'phone'): Observable<any> {
    return this.http.post(`${this.apiUrl}/verification/send-code`, { contact, type });
  }

  // Проверка кода
  verifyCode(contact: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verification/verify-code`, { contact, code });
  }

  verifyEmail(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/verify-email`, { email, code });
  }

  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/resend-verification`, { email });
  }
} 