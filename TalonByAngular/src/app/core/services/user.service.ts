import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User, Patient } from '../../shared/interfaces/user.interface';
import { AuthService, UserInfo } from './auth.service';
import { MedicalAppointmentDTO } from '../../shared/interfaces/medical-appointment.interface';
import { PatientCardService } from './patient-card.service';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser = this.currentUserSubject.asObservable();
  
  // Добавляем кеширование для профиля
  private lastProfileFetch = 0;
  private cacheLifetime = 5 * 60 * 1000; // 5 минут
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private patientCardService: PatientCardService
  ) {
    // Инициализируем только при первом запуске, не делаем запрос сразу
    const cachedUser = localStorage.getItem('user_profile_cache');
    if (cachedUser) {
      try {
        const userData = JSON.parse(cachedUser);
        this.currentUserSubject.next(userData);
        this.lastProfileFetch = parseInt(localStorage.getItem('user_profile_timestamp') || '0', 10);
      } catch (e) {
        // Ошибка загрузки кеша
      }
    }
    
    // Subscribe to auth state changes to clear cache on logout
    this.authService.authState.subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        this.clearUserCache();
      }
    });
  }

  // Method to clear all user cache data
  clearUserCache(): void {
    // Reset in-memory cache
    this.lastProfileFetch = 0;
    this.currentUserSubject.next(null);
    
    // Clear localStorage cache
    localStorage.removeItem('user_profile_cache');
    localStorage.removeItem('user_profile_timestamp');
    
    // Clear any other user-related cached data
    localStorage.removeItem('appointment_confirmation');
  }

  getUserProfile(forceRefresh: boolean = false): Observable<User> {
    // Always force refresh on first load or if specifically requested
    const now = Date.now();
    const cacheExpired = now - this.lastProfileFetch > this.cacheLifetime;
    const cachedUser = this.currentUserSubject.value;
    
    if (forceRefresh || cacheExpired || !cachedUser) {
      // Clear any cached data first
      if (forceRefresh) {
        localStorage.removeItem('user_profile_cache');
        localStorage.removeItem('user_profile_timestamp');
        this.lastProfileFetch = 0;
      }
      
      // First refresh auth data to ensure we have the latest token info
      return this.authService.refreshUserData().pipe(
        switchMap(authUserInfo => {
          // Get user info from auth service
          const userInfo = this.authService.getUserInfo();
          
          // Then get detailed profile data
          return this.http.get<any>(
            `${environment.apiUrl}/users/profile`,
            { withCredentials: true }
          ).pipe(
            map(profileData => {
              // Create user object using auth data + profile data
              const user: User = {
                userId: userInfo?.userId ? parseInt(userInfo.userId.toString(), 10) : 0,
                email: userInfo?.email || '', // Keep email from auth token
                fullName: profileData?.fullName || '',
                phone: userInfo?.phone || profileData?.phone || '',
                role: userInfo?.role || profileData?.role || 'Patient',
                patients: Array.isArray(profileData?.patients) ? profileData.patients.map((p: any) => ({
                  patientId: p.patientId,
                  fullName: p.name,
                  relationship: p.gender === 0 ? 'male' : 'female',
                  birthDate: new Date(p.dateOfBirth).toISOString().split('T')[0],
                  isAdult: true,
                  address: p.address
                })) : []
              };
              
              // Log the created user object for debugging
              console.log('User profile loaded:', user);
              
              // Update cache
              this.lastProfileFetch = Date.now();
              localStorage.setItem('user_profile_cache', JSON.stringify(user));
              localStorage.setItem('user_profile_timestamp', this.lastProfileFetch.toString());
              
              this.currentUserSubject.next(user);
              return user;
            }),
            catchError(error => {
              console.error('Error fetching profile:', error);
              
              // Use auth data if profile fetch fails
              if (userInfo) {
                const minimalUser: User = {
                  userId: parseInt(userInfo.userId.toString(), 10),
                  email: userInfo.email,
                  fullName: '',
                  role: userInfo.role || 'Patient',
                  phone: userInfo.phone || '',
                  patients: []
                };
                console.log('Using minimal user profile:', minimalUser);
                this.currentUserSubject.next(minimalUser);
                return of(minimalUser);
              }
              
              return of(this.currentUserSubject.value || {} as User);
            })
          );
        })
      );
    }
    
    // Return cached data if available and not expired
    return of(cachedUser);
  }
  
  updateUserProfile(userData: Partial<User>): Observable<User> {
    // Clear all caches before making the update
    localStorage.removeItem('user_profile_cache');
    localStorage.removeItem('user_profile_timestamp');
    this.lastProfileFetch = 0;
    
    // Send the profile update request
    return this.http.put<any>(
      `${environment.apiUrl}/users/profile`,
      userData,
      { withCredentials: true }
    ).pipe(
      switchMap(response => {
        // After profile update, we need to get a fresh token from the server
        // This is important because we need the token to match the updated user data
        return this.http.post<any>(
          `${environment.apiUrl}/auth/refresh-token`,
          { refreshToken: this.authService.getRefreshToken() },
          { withCredentials: true }
        ).pipe(
          switchMap(refreshResponse => {
            // Update token storage
            if (refreshResponse.token) {
              this.authService.handleAuthentication(refreshResponse.token);
              if (refreshResponse.refreshToken) {
                localStorage.setItem('talonby_refreshToken', refreshResponse.refreshToken);
              }
        }
        
            // Now force refresh the user profile with new token data
            return this.getUserProfile(true);
      }),
          catchError(() => {
            // Even if token refresh fails, try to get updated profile
            return this.getUserProfile(true);
          })
        );
      }),
      catchError(() => {
        return of(this.currentUserSubject.value || {} as User);
      })
    );
  }
  
  updateUserSettings(settings: { email?: string; phone?: string }): Observable<boolean> {
    console.log('Updating user settings:', settings);
    
    // Clear cache to ensure we get fresh data after update
    localStorage.removeItem('user_profile_cache');
    localStorage.removeItem('user_profile_timestamp');
    this.lastProfileFetch = 0;
    
    return this.http.put<any>(`${environment.apiUrl}/users/profile`, settings).pipe(
      tap(response => {
        console.log('Settings update response:', response);
        
        // Refresh user data after successful update
        setTimeout(() => this.refreshAllUserData().subscribe(), 500);
      }),
      map(() => true),
      catchError(error => {
        console.error('Error updating user settings:', error);
        return of(false);
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
      switchMap(response => {
        // Преобразуем ответ сервера в нашу модель
        const newPatient: Patient = {
          patientId: response.patientId,
          fullName: response.name,
          relationship: response.gender === 0 ? 'male' : 'female',
          birthDate: new Date(response.dateOfBirth).toISOString().split('T')[0],
          isAdult: true,
          address: response.address
        };
        
        // Автоматически создаем медицинскую карту для нового пациента
        const patientCard = {
          patientId: newPatient.patientId,
          bloodType: null
        };
        
        return this.patientCardService.createPatientCard(patientCard).pipe(
          map(() => {
            console.log('Медицинская карта автоматически создана для пациента ID:', newPatient.patientId);
            return newPatient;
          }),
          catchError(error => {
            console.error('Ошибка при создании медицинской карты:', error);
            return of(newPatient); // Возвращаем пациента даже в случае ошибки
          }),
          tap(() => {
            // Сбрасываем кеш, чтобы при следующем запросе получить актуальные данные
            this.lastProfileFetch = 0;
            localStorage.removeItem('user_profile_cache');
            localStorage.removeItem('user_profile_timestamp');
            
            // Обновляем состояние - если есть текущие данные
            const currentUser = this.currentUserSubject.value;
            if (currentUser) {
              const updatedPatients = currentUser.patients ? [...currentUser.patients, newPatient] : [newPatient];
              
              const updatedUser: User = {
                ...currentUser,
                patients: updatedPatients
              };
              
              this.currentUserSubject.next(updatedUser);
            }
          })
        );
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
        
        // Сбрасываем кеш, чтобы при следующем запросе получить актуальные данные
        this.lastProfileFetch = 0;
        localStorage.removeItem('user_profile_cache');
        localStorage.removeItem('user_profile_timestamp');
        
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
      }),
      catchError(error => {
        throw error;
      })
    );
  }
  
  deletePatient(patientId: number): Observable<boolean> {
    return this.http.delete<void>(
      `${environment.apiUrl}/patients/${patientId}`,
      { withCredentials: true }
    ).pipe(
      map(() => {
        // Сбрасываем кеш, чтобы при следующем запросе получить актуальные данные
        this.lastProfileFetch = 0;
        localStorage.removeItem('user_profile_cache');
        localStorage.removeItem('user_profile_timestamp');
        
        // Обновляем локальное состояние
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
      catchError(() => {
        return of(false);
      })
    );
  }
  
  // Метод для принудительного обновления всех данных пользователя
  refreshAllUserData(): Observable<User> {
    // Clear all caches
    this.lastProfileFetch = 0;
    localStorage.removeItem('user_profile_cache');
    localStorage.removeItem('user_profile_timestamp');
    
    // Force refresh from auth service first
    return this.authService.refreshUserData().pipe(
      switchMap(() => this.getUserProfile(true)),
      tap(() => {
        // Данные профиля обновлены
      })
    );
  }

  // Get user's medical appointments with optional filtering
  getUserAppointments(params: {
    status?: number,
    dateFrom?: string,
    dateTo?: string
  } = {}): Observable<MedicalAppointmentDTO[]> {
    // Build query parameters
    let queryParams = '';
    const paramEntries = Object.entries(params).filter(([_, value]) => value !== undefined);
    
    if (paramEntries.length > 0) {
      queryParams = '?' + paramEntries
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
    }
    
    return this.http.get<MedicalAppointmentDTO[]>(`${environment.apiUrl}/MedicalAppointment/GetByParameters${queryParams}`);
  }
} 