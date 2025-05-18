import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScheduleStatistics, ScheduleOptimization, StatisticsRequest, OptimizationTrends } from '../../shared/interfaces/statistics.interface';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Получение статистики по расписанию
   * @param request - параметры запроса статистики
   */
  getScheduleStatistics(request: StatisticsRequest): Observable<ScheduleStatistics> {
    let params = new HttpParams();
    
    // Добавляем параметры в запрос
    params = params.append('scope', request.scope);
    params = params.append('period', request.period);
    
    if (request.hospitalId) {
      params = params.append('hospitalId', request.hospitalId.toString());
    }
    
    if (request.specialtyId) {
      params = params.append('specialtyId', request.specialtyId.toString());
    }
    
    if (request.doctorId) {
      params = params.append('doctorId', request.doctorId.toString());
    }
    
    if (request.fromDate) {
      params = params.append('fromDate', request.fromDate);
    }
    
    if (request.toDate) {
      params = params.append('toDate', request.toDate);
    }
    
    // Делаем запрос к API
    return this.http.get<ScheduleStatistics>(`${this.apiUrl}/statistics/schedule`, { params });
  }

  /**
   * Получение рекомендаций по оптимизации расписания
   * @param request - параметры запроса статистики
   */
  getScheduleOptimization(request: StatisticsRequest): Observable<ScheduleOptimization> {
    let params = new HttpParams();
    
    // Добавляем параметры в запрос
    params = params.append('scope', request.scope);
    params = params.append('period', request.period);
    
    if (request.hospitalId) {
      params = params.append('hospitalId', request.hospitalId.toString());
    }
    
    if (request.specialtyId) {
      params = params.append('specialtyId', request.specialtyId.toString());
    }
    
    if (request.doctorId) {
      params = params.append('doctorId', request.doctorId.toString());
    }
    
    if (request.fromDate) {
      params = params.append('fromDate', request.fromDate);
    }
    
    if (request.toDate) {
      params = params.append('toDate', request.toDate);
    }
    
    if (request.startFromToday !== undefined) {
      params = params.append('startFromToday', request.startFromToday.toString());
    }
    
    // Делаем запрос к API
    return this.http.get<ScheduleOptimization>(`${this.apiUrl}/statistics/schedule/optimization`, { params });
  }

  /**
   * Анализ трендов загруженности для более точных рекомендаций
   * @param request - параметры запроса статистики
   */
  getScheduleTrends(request: StatisticsRequest): Observable<OptimizationTrends> {
    let params = new HttpParams();
    
    // Добавляем параметры в запрос
    params = params.append('scope', request.scope);
    params = params.append('period', request.period);
    
    if (request.hospitalId) {
      params = params.append('hospitalId', request.hospitalId.toString());
    }
    
    if (request.specialtyId) {
      params = params.append('specialtyId', request.specialtyId.toString());
    }
    
    if (request.doctorId) {
      params = params.append('doctorId', request.doctorId.toString());
    }
    
    if (request.startFromToday !== undefined) {
      params = params.append('startFromToday', request.startFromToday.toString());
    }
    
    // Делаем запрос к API
    return this.http.get<OptimizationTrends>(`${this.apiUrl}/statistics/schedule/trends`, { params });
  }

  /**
   * Получение статистики по доступности слотов для конкретного врача
   * @param doctorId - идентификатор врача
   * @param fromDate - начальная дата
   * @param toDate - конечная дата
   */
  getDoctorSlotStatistics(doctorId: number, fromDate: string, toDate: string): Observable<ScheduleStatistics> {
    let params = new HttpParams()
      .append('fromDate', fromDate)
      .append('toDate', toDate);
    
    return this.http.get<ScheduleStatistics>(`${this.apiUrl}/statistics/doctor/${doctorId}/slots`, { params });
  }

  /**
   * Получение статистики по загруженности больницы
   * @param hospitalId - идентификатор больницы
   * @param period - период статистики
   */
  getHospitalOccupancyStatistics(hospitalId: number, period: string): Observable<ScheduleStatistics> {
    let params = new HttpParams()
      .append('period', period);
    
    return this.http.get<ScheduleStatistics>(`${this.apiUrl}/statistics/hospital/${hospitalId}/occupancy`, { params });
  }
} 