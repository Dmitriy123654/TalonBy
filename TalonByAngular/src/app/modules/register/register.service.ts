// register.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RegisterService {
  private apiUrl = 'http://localhost:36837/auth/register';

  constructor(private http: HttpClient) {}

  register(email: string, password: string, Phone: string): Observable<any> {
    const data = { email, password, Phone };
    return this.http.post(this.apiUrl, data);
  }
}
