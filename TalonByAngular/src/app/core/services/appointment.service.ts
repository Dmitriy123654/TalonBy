import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MedicalAppointmentDTO } from '../../shared/interfaces/medical-appointment.interface';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get filtered appointments
   * @param filters - Object containing filter parameters
   */
  getFilteredAppointments(filters: any): Observable<MedicalAppointmentDTO[]> {
    // Create HttpParams object
    let params = new HttpParams();
    
    // Add each filter parameter to the request params if it has a value
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        // Convert keys to match backend parameter naming (camelCase to PascalCase for .NET)
        const pascalCaseKey = key.charAt(0).toUpperCase() + key.slice(1);
        params = params.append(pascalCaseKey, value.toString());
      }
    });
    
    return this.http.get<MedicalAppointmentDTO[]>(`${this.apiUrl}/MedicalAppointment/GetByParameters`, { params });
  }

  /**
   * Cancel appointment
   * @param appointmentId - ID of appointment to cancel
   */
  cancelAppointment(appointmentId: number): Observable<any> {
    // Обновляем статус талона на "Отменен" (3)
    return this.http.put(`${this.apiUrl}/MedicalAppointment/Update/${appointmentId}`, {
      receptionStatusId: 3
    });
  }

  /**
   * Complete appointment
   * @param appointmentId - ID of appointment to mark as completed
   */
  completeAppointment(appointmentId: number): Observable<any> {
    // Обновляем статус талона на "Выполнен" (1)
    return this.http.put(`${this.apiUrl}/MedicalAppointment/Update/${appointmentId}`, {
      receptionStatusId: 1
    });
  }
} 