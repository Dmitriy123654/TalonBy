import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { 
  Hospital, 
  Doctor, 
  TimeSlot, 
  Appointment, 
  Speciality, 
  DoctorDetails 
} from '../../shared/interfaces/order.interface';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getHospitals(): Observable<Hospital[]> {
    return this.http.get<any>(`${this.apiUrl}/Hospital/GetAllHospitals`).pipe(
      map(response => {
        console.log('Raw hospital response:', response); // Добавим для отладки

        // Если response уже является массивом, используем его напрямую
        const hospitals = Array.isArray(response) ? response : 
                        response.$values ? response.$values : 
                        [];

        console.log('Hospitals after extraction:', hospitals); // Для отладки

        return hospitals.map((hospital: any) => ({
          hospitalId: Number(hospital.hospitalId),
          name: hospital.name?.trim() || '',
          address: hospital.address || '',
          type: hospital.type || 0,
          workingHours: hospital.workingHours || '',
          phones: hospital.phones || '',
          email: hospital.email || '',
          description: hospital.description || ''
        }));
      })
    );
  }

  // Получение специальностей для больницы
  getSpecialities(hospitalId: number): Observable<Speciality[]> {
    return this.http.get<any>(`${this.apiUrl}/DoctorsSpeciality/GetByHospital/${hospitalId}`)
      .pipe(
        map(response => {
          console.log('Raw specialities response:', response);
          const specialities = Array.isArray(response) ? response :
                             response.$values ? response.$values :
                             [];
          return specialities.map((spec: any) => ({
            doctorsSpecialityId: spec.doctorsSpecialityId,
            name: spec.name || '',
            link: '',
            description: spec.description || ''
          }));
        })
      );
  }

  // Получение докторов по больнице
  getDoctorsByHospital(hospitalId: number): Observable<DoctorDetails[]> {
    return this.http.get<any>(`${this.apiUrl}/Doctor/GetByHospital/${hospitalId}`)
      .pipe(
        map(response => {
          const doctors = Array.isArray(response) ? response :
                        response.$values ? response.$values :
                        [];
          return doctors;
        })
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
        map(response => {
          console.log('Raw doctors response:', response);
          const doctors = Array.isArray(response) ? response :
                        response.$values ? response.$values :
                        [];
          return doctors;
        })
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