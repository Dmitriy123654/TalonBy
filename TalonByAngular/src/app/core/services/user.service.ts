import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, Patient, PatientType } from '../../shared/interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  // Mock data for development until backend is ready
  private mockUser: User = {
    userId: 1,
    email: 'dimaermak06@gmail.com',
    fullName: 'Ермак Дмитрий Сергеевич',
    address: 'г. Минск, ул. Макаёнка 12а, корп. -, кв. 202',
    birthDate: '10 ноября 2003 г.',
    phone: '+375291234567',
    patients: []
  };
  
  constructor(private http: HttpClient) {
    // For development, initialize with mock data
    this.currentUserSubject.next(this.mockUser);
  }

  getUserProfile(): Observable<User> {
    // For development, return mock data
    // In production, uncomment the HTTP request
    
    /*
    return this.http.get<User>(
      `${environment.apiUrl}/users/profile`,
      { withCredentials: true }
    ).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      }),
      catchError(error => {
        console.error('Error fetching user profile:', error);
        return of(null);
      })
    );
    */
    
    return of(this.mockUser);
  }
  
  updateUserProfile(userData: Partial<User>): Observable<User> {
    // For development, update mock data
    this.mockUser = { ...this.mockUser, ...userData };
    this.currentUserSubject.next(this.mockUser);
    
    /*
    return this.http.put<User>(
      `${environment.apiUrl}/users/profile`,
      userData,
      { withCredentials: true }
    ).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
      })
    );
    */
    
    return of(this.mockUser);
  }
  
  addPatient(patient: Omit<Patient, 'patientId'>): Observable<Patient> {
    // For development, add to mock data
    const newPatient: Patient = {
      ...patient,
      patientId: Date.now() // Generate unique ID for development
    };
    
    this.mockUser.patients = [...(this.mockUser.patients || []), newPatient];
    this.currentUserSubject.next(this.mockUser);
    
    /*
    return this.http.post<Patient>(
      `${environment.apiUrl}/users/patients`,
      patient,
      { withCredentials: true }
    ).pipe(
      tap(newPatient => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser) {
          currentUser.patients = [...(currentUser.patients || []), newPatient];
          this.currentUserSubject.next(currentUser);
        }
      })
    );
    */
    
    return of(newPatient);
  }
  
  deletePatient(patientId: number): Observable<boolean> {
    // For development, remove from mock data
    if (this.mockUser.patients) {
      this.mockUser.patients = this.mockUser.patients.filter(p => p.patientId !== patientId);
      this.currentUserSubject.next(this.mockUser);
    }
    
    /*
    return this.http.delete<void>(
      `${environment.apiUrl}/users/patients/${patientId}`,
      { withCredentials: true }
    ).pipe(
      tap(() => {
        const currentUser = this.currentUserSubject.value;
        if (currentUser && currentUser.patients) {
          currentUser.patients = currentUser.patients.filter(p => p.patientId !== patientId);
          this.currentUserSubject.next(currentUser);
        }
      }),
      map(() => true),
      catchError(() => of(false))
    );
    */
    
    return of(true);
  }
} 