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
  private apiUrl = `${environment.apiUrl}/doctors`;

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
    return this.http.get<Doctor[]>(`${this.apiUrl}/by-hospital-specialty`, {
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
    return this.http.get<any>(`${this.apiUrl}/current`);
  }

  // Get all doctors
  getAllDoctors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetAll`);
  }

  // Get doctor by ID
  getDoctorById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/GetById ${id}`);
  }

  // Create new doctor
  createDoctor(doctorData: any): Observable<any> {
    console.log('Creating doctor with data:', doctorData);
    return this.http.post<any>(`${this.apiUrl}/Create`, doctorData);
  }

  // Update existing doctor
  updateDoctor(id: number, doctorData: any): Observable<any> {
    console.log('Updating doctor ID', id, 'with data:', doctorData);
    return this.http.put<any>(`${this.apiUrl}/Update ${id}`, doctorData);
  }

  // Delete doctor
  deleteDoctor(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/Delete ${id}`);
  }

  // Get doctors by speciality
  getDoctorsBySpeciality(specialityId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetBySpeciality/${specialityId}`);
  }

  // Get doctors by hospital
  getDoctorsByHospital(hospitalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/GetByHospital/${hospitalId}`);
  }

  // Get all specialities
  getAllSpecialities(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/DoctorsSpeciality/GetAll`);
  }

  // Get all hospitals
  getAllHospitals(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/Hospital/GetAllHospitals`);
  }
} 