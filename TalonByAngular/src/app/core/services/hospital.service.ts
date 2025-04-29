import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Hospital } from '../../shared/interfaces/hospital.interface';

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
    return this.http.get<Hospital[]>(`${this.apiUrl}/hospitals`);
  }

  /**
   * Get hospital by ID
   * @param hospitalId - ID of hospital to retrieve
   */
  getHospitalById(hospitalId: number): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.apiUrl}/hospitals/${hospitalId}`);
  }

  /**
   * Get hospital associated with the logged-in chief doctor
   */
  getChiefDoctorHospital(): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.apiUrl}/hospitals/chief-doctor`);
  }
} 