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
    // Обновляем статус талона на "Отменен" используя новый эндпоинт
    const statusData = {
      appointmentId: appointmentId,
      receptionStatusId: 5, // ID в базе данных для статуса "Отменен"
      fileResultLink: null
    };
    return this.http.put(`${this.apiUrl}/MedicalAppointment/UpdateStatus`, statusData);
  }

  /**
   * Complete appointment
   * @param appointmentId - ID of appointment to mark as completed
   */
  completeAppointment(appointmentId: number): Observable<any> {
    // Обновляем статус талона на "Выполнен" используя новый эндпоинт
    const statusData = {
      appointmentId: appointmentId,
      receptionStatusId: 2, // ID в базе данных для статуса "Выполнен"
      fileResultLink: null
    };
    return this.http.put(`${this.apiUrl}/MedicalAppointment/UpdateStatus`, statusData);
  }

  /**
   * Update appointment with full data
   * @param appointmentId - ID of appointment to update
   * @param appointmentData - Full appointment data with updated fields
   */
  updateAppointment(appointmentId: number, appointmentData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/MedicalAppointment/Update/${appointmentId}`, appointmentData);
  }

  /**
   * Update appointment status
   * @param appointmentId - ID of appointment to update
   * @param statusId - New status ID
   */
  updateAppointmentStatus(appointmentId: number, statusId: number): Observable<any> {
    // Используем новый эндпоинт для обновления только статуса
    const statusData = {
      appointmentId: appointmentId,
      receptionStatusId: statusId,
      fileResultLink: null // Отправляем null вместо пустой строки
    };
    
    return this.http.put(`${this.apiUrl}/MedicalAppointment/UpdateStatus`, statusData);
  }
} 