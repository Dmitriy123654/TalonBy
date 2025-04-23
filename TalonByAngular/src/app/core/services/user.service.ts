import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, Patient } from '../../shared/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  constructor(private http: HttpClient) {
    // При инициализации попробуем получить данные пользователя
    this.getUserProfile().subscribe({
      error: (err) => console.error('Error loading initial user profile:', err)
    });
  }

  getUserProfile(): Observable<User> {
    return this.http.get<any>(
      `${environment.apiUrl}/users/profile`,
      { withCredentials: true }
    ).pipe(
      map(response => {
        // Преобразуем данные в формат фронтенда
        const user: User = {
          userId: response.userId,
          email: response.email,
          fullName: response.fullName || '',
          phone: response.phone,
          patients: Array.isArray(response.patients) ? response.patients.map((p: any) => ({
            patientId: p.patientId,
            fullName: p.name,
            relationship: p.gender === 0 ? 'male' : 'female',
            birthDate: new Date(p.dateOfBirth).toISOString().split('T')[0],
            isAdult: true,
            address: p.address
          })) : []
        };
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return of(this.currentUserSubject.value || {} as User);
      })
    );
  }
  
  updateUserProfile(userData: Partial<User>): Observable<User> {
    return this.http.put<any>(
      `${environment.apiUrl}/users/profile`,
      userData,
      { withCredentials: true }
    ).pipe(
      map(response => {
        // Преобразуем данные в формат фронтенда
        const user: User = {
          userId: response.userId,
          email: response.email,
          fullName: response.fullName || '',
          phone: response.phone,
          patients: Array.isArray(response.patients) ? response.patients.map((p: any) => ({
            patientId: p.patientId,
            fullName: p.name,
            relationship: p.gender === 0 ? 'male' : 'female',
            birthDate: new Date(p.dateOfBirth).toISOString().split('T')[0],
            isAdult: true,
            address: p.address
          })) : []
        };
        
        this.currentUserSubject.next(user);
        return user;
      }),
      catchError(error => {
        console.error('Error updating user profile:', error);
        return of(this.currentUserSubject.value || {} as User);
      })
    );
  }
  
  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(
      `${environment.apiUrl}/auth/change-password`,
      { currentPassword, newPassword },
      { withCredentials: true }
    );
  }
  
  // Методы для работы с пациентами
  addPatient(patient: Omit<Patient, 'patientId'>): Observable<Patient> {
    // Сопоставляем поля нашей модели с моделью сервера
    const serverPatient = {
      name: patient.fullName,
      gender: patient.relationship === 'male' ? 0 : 1, // В enum Gender: 0 - Male, 1 - Female
      dateOfBirth: new Date(patient.birthDate), // Преобразуем строку в дату
      address: patient.address || '',
    };
    
    return this.http.post<any>(
      `${environment.apiUrl}/patients`,
      serverPatient,
      { withCredentials: true }
    ).pipe(
      map(response => {
        // Преобразуем ответ сервера в нашу модель
        const newPatient: Patient = {
          patientId: response.patientId,
          fullName: response.name,
          relationship: response.gender === 0 ? 'male' : 'female',
          birthDate: new Date(response.dateOfBirth).toISOString().split('T')[0],
          isAdult: true,
          address: response.address
        };
        
        // Обновляем состояние
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          const updatedPatients = [...(currentUser.patients || []), newPatient];
          this.currentUserSubject.next({
            ...currentUser,
            patients: updatedPatients
          });
        }
        
        return newPatient;
      })
    );
  }
  
  updatePatient(patientId: number, patientData: Partial<Patient>): Observable<Patient> {
    // Сопоставляем поля нашей модели с моделью сервера
    const serverPatient = {
      patientId: patientId,
      name: patientData.fullName,
      gender: patientData.relationship === 'male' ? 0 : 1,
      dateOfBirth: patientData.birthDate ? new Date(patientData.birthDate) : undefined,
      address: patientData.address
    };
    
    return this.http.put<any>(
      `${environment.apiUrl}/patients/${patientId}`,
      serverPatient,
      { withCredentials: true }
    ).pipe(
      map(response => {
        // Преобразуем ответ сервера в нашу модель
        const updatedPatient: Patient = {
          patientId: response.patientId,
          fullName: response.name,
          relationship: response.gender === 0 ? 'male' : 'female',
          birthDate: new Date(response.dateOfBirth).toISOString().split('T')[0],
          isAdult: true,
          address: response.address
        };
        
        // Обновляем состояние
        const currentUser = this.currentUserSubject.value;
        if (currentUser && currentUser.patients) {
          const updatedPatients = currentUser.patients.map(p => 
            p.patientId === patientId ? updatedPatient : p
          );
          this.currentUserSubject.next({
            ...currentUser,
            patients: updatedPatients
          });
        }
        
        return updatedPatient;
      })
    );
  }
  
  deletePatient(patientId: number): Observable<boolean> {
    return this.http.delete<void>(
      `${environment.apiUrl}/patients/${patientId}`,
      { withCredentials: true }
    ).pipe(
      map(() => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser && currentUser.patients) {
          const updatedPatients = currentUser.patients.filter(p => p.patientId !== patientId);
          this.currentUserSubject.next({
            ...currentUser,
            patients: updatedPatients
          });
        }
        return true;
      }),
      catchError(() => of(false))
    );
  }
} 