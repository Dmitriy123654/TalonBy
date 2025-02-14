import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Hospital, Department, Doctor, TimeSlot, Appointment } from '../interfaces/order.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getHospitals(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(`${this.apiUrl}/hospitals`);
  }

  getDepartments(hospitalId: number): Observable<Department[]> {
    return this.http.get<Department[]>(`${this.apiUrl}/hospitals/${hospitalId}/departments`);
  }

  getDoctors(departmentId: number): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/departments/${departmentId}/doctors`);
  }

  getTimeSlots(doctorId: number, date: string): Observable<TimeSlot[]> {
    return this.http.get<TimeSlot[]>(`${this.apiUrl}/doctors/${doctorId}/timeslots`, {
      params: { date }
    });
  }

  createAppointment(appointment: Omit<Appointment, 'id' | 'createdAt'>): Observable<Appointment> {
    return this.http.post<Appointment>(`${this.apiUrl}/order`, appointment);
  }
} 