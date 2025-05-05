import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PatientCardService } from './patient-card.service';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private apiUrl = `${environment.apiUrl}/patients`;

  constructor(
    private http: HttpClient,
    private patientCardService: PatientCardService
  ) { }

  // Patient methods
  getAllPatients(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getPatientById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createPatient(patient: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, patient);
  }

  // Создание пациента с автоматическим созданием медкарты
  createPatientWithCard(patient: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, patient).pipe(
      switchMap(createdPatient => {
        // Создаем медицинскую карту для нового пациента
        const patientCard = {
          patientId: createdPatient.patientId,
          bloodType: null
        };
        
        return this.patientCardService.createPatientCard(patientCard).pipe(
          // Возвращаем объект, содержащий и пациента, и его карту
          switchMap(createdCard => {
            return of({
              patient: createdPatient,
              patientCard: createdCard
            });
          }),
          // Если не удалось создать карту, все равно возвращаем пациента
          catchError(error => {
            console.error('Failed to create patient card:', error);
            return of({
              patient: createdPatient,
              error: 'Failed to create patient card'
            });
          })
        );
      })
    );
  }

  updatePatient(patient: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${patient.patientId}`, patient);
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
} 