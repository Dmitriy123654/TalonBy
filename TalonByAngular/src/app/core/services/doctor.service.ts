import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor } from '../../shared/interfaces/doctor.interface';
import { DoctorsSpeciality } from '../../shared/interfaces/doctors-speciality.interface';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get specialties available at a hospital
   * @param hospitalId - ID of hospital to get specialties for
   */
  getSpecialtiesByHospital(hospitalId: number): Observable<DoctorsSpeciality[]> {
    return this.http.get<DoctorsSpeciality[]>(`${this.apiUrl}/specialties/by-hospital/${hospitalId}`);
  }

  /**
   * Get doctors by hospital and specialty
   * @param hospitalId - ID of hospital
   * @param specialtyId - ID of specialty
   */
  getDoctorsByHospitalAndSpecialty(hospitalId: number, specialtyId: number): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.apiUrl}/doctors/by-hospital-specialty`, {
      params: {
        hospitalId: hospitalId.toString(),
        specialtyId: specialtyId.toString()
      }
    });
  }

  /**
   * Get information about the currently logged-in doctor
   */
  getCurrentDoctorInfo(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/doctors/current`);
  }
} 