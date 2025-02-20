import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Hospital, Doctor, TimeSlot, Appointment, DoctorSpeciality, Speciality, DoctorDetails } from '../interfaces/order.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) {}

  getHospitals(): Observable<Hospital[]> {
    return this.http.get<any>(`${this.apiUrl}/Hospital/GetAllHospitals`).pipe(
      map(response => {
        const hospitals = response.$values || [];
        return hospitals.map((hospital: any) => ({
          hospitalId: Number(hospital.hospitalId),
          name: hospital.name?.trim(),
          address: hospital.address,
          type: hospital.type,
          workingHours: hospital.workingHours,
          phones: hospital.phones,
          email: hospital.email,
          description: hospital.description
        }));
      })
    );
  }

  // Получение специальностей для больницы
  getSpecialities(hospitalId: number): Observable<Speciality[]> {
    return this.http.get<any>(`${this.apiUrl}/DoctorsSpeciality/GetByHospital/${hospitalId}`).pipe(
      map(response => (response.$values || []).map((spec: any) => ({
        id: spec.id,
        name: spec.name,
        link: ''
      })))
    );
  }

  // Получение докторов по больнице
  getDoctorsByHospital(hospitalId: number): Observable<DoctorDetails[]> {
    return this.http.get<any>(`${this.apiUrl}/Doctor/GetByHospital/${hospitalId}`)
      .pipe(
        map(response => response.$values || [])
      );
  }

  // Получение докторов по специальности
  getDoctorsBySpeciality(specialityId: number): Observable<DoctorDetails[]> {
    return this.http.get<DoctorDetails[]>(`${this.apiUrl}/Doctor/GetBySpeciality/${specialityId}`);
  }

  // Получение докторов по специальности и больнице
  getDoctorsBySpecialityAndHospital(hospitalId: number, specialityId: number): Observable<DoctorDetails[]> {
    return this.http.get<any>(`${this.apiUrl}/Doctor/GetBySpecialtyAndHospital/${hospitalId}/${specialityId}`)
      .pipe(
        map(response => response.$values || [])
      );
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