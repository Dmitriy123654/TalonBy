import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Hospital, HospitalType } from '../../shared/interfaces/hospital.interface';

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get all hospitals
   */
  getHospitals(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(`${this.apiUrl}/Hospital/GetAllHospitals`);
  }

  /**
   * Get hospital by ID
   * @param hospitalId - ID of hospital to retrieve
   */
  getHospitalById(hospitalId: number): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.apiUrl}/Hospital/GetById/${hospitalId}`);
  }

  /**
   * Get hospital associated with the logged-in chief doctor
   */
  getChiefDoctorHospital(): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.apiUrl}/hospitals/chief-doctor`);
  }

  /**
   * Create a new hospital
   * @param hospital - Hospital data to create
   */
  createHospital(hospital: Omit<Hospital, 'hospitalId'>): Observable<any> {
    // Конвертируем строковый тип в числовой перед отправкой
    const hospitalDTO = {
      ...hospital,
      type: this.convertHospitalTypeToNumber(hospital.type)
    };
    
    // Отправляем данные напрямую без обертки
    return this.http.post(`${this.apiUrl}/Hospital/Create`, hospitalDTO);
  }

  /**
   * Update an existing hospital
   * @param hospitalId - ID of hospital to update
   * @param hospital - Updated hospital data
   */
  updateHospital(hospitalId: number, hospital: Omit<Hospital, 'hospitalId'>): Observable<any> {
    // Конвертируем строковый тип в числовой перед отправкой
    const hospitalDTO = {
      ...hospital,
      type: this.convertHospitalTypeToNumber(hospital.type)
    };
    
    // Отправляем данные напрямую без обертки
    return this.http.put(`${this.apiUrl}/Hospital/Update/${hospitalId}`, hospitalDTO);
  }

  /**
   * Delete a hospital
   * @param hospitalId - ID of hospital to delete
   */
  deleteHospital(hospitalId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/Hospital/Delete/${hospitalId}`);
  }

  /**
   * Конвертирует строковое представление типа больницы в числовое для API
   */
  private convertHospitalTypeToNumber(type: HospitalType): number {
    switch(type) {
      case HospitalType.Adult: return 0;
      case HospitalType.Children: return 1;
      case HospitalType.Specialized: return 2;
      default: return 0; // По умолчанию Adult
    }
  }
} 