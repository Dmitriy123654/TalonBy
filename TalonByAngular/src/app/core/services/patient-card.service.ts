import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PatientCardService {
  private apiUrl = `${environment.apiUrl}/PatientCard`;

  constructor(private http: HttpClient) { }

  // PatientCard methods
  getAllPatientCards(): Observable<any> {
    return this.http.get<any>(this.apiUrl);
  }

  getPatientCardById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getPatientCardByPatientId(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/patient/${patientId}`);
  }

  createPatientCard(patientCard: any): Observable<any> {
    console.log('Создаем карточку пациента:', patientCard);
    
    // Преобразуем числовой гендер в строковый
    let genderString = 'Male';
    if (patientCard.patientGender === 1) {
      genderString = 'Male';
    } else if (patientCard.patientGender === 2) {
      genderString = 'Female';
    } else if (typeof patientCard.patientGender === 'string') {
      genderString = patientCard.patientGender;
    }
    
    // Создаем запрос по точной структуре, ожидаемой сервером
    const requestData = {
      patientId: patientCard.patientId,
      bloodType: patientCard.bloodType || 'O+',
      patientName: patientCard.patientName || '',
      patientGender: genderString,
      lastUpdate: new Date().toISOString() // Формат ISO для .NET DateTime
    };
    
    console.log('Данные запроса:', requestData);
    return this.http.post<any>(this.apiUrl, requestData);
  }

  updatePatientCard(patientCard: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${patientCard.patientCardId}`, patientCard);
  }

  deletePatientCard(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Allergy methods
  getAllergiesByPatientCardId(patientCardId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${patientCardId}/allergies`);
  }

  addAllergy(patientCardId: number, allergy: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${patientCardId}/allergies`, allergy);
  }

  updateAllergy(allergy: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/allergies/${allergy.allergyId}`, allergy);
  }

  deleteAllergy(allergyId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/allergies/${allergyId}`);
  }

  // Chronic Condition methods
  getChronicConditionsByPatientCardId(patientCardId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${patientCardId}/conditions`);
  }

  addChronicCondition(patientCardId: number, condition: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${patientCardId}/conditions`, condition);
  }

  updateChronicCondition(condition: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/conditions/${condition.conditionId}`, condition);
  }

  deleteChronicCondition(conditionId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/conditions/${conditionId}`);
  }

  // Immunization methods
  getImmunizationsByPatientCardId(patientCardId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${patientCardId}/immunizations`);
  }

  addImmunization(patientCardId: number, immunization: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${patientCardId}/immunizations`, immunization);
  }

  updateImmunization(immunization: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/immunizations/${immunization.immunizationId}`, immunization);
  }

  deleteImmunization(immunizationId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/immunizations/${immunizationId}`);
  }
} 