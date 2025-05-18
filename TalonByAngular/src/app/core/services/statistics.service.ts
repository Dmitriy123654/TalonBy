import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ScheduleStatistics, StatisticsRequest } from '../../shared/interfaces/statistics.interface';
import { catchError, map } from 'rxjs/operators';

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
    
    // В реальном приложении здесь будет вызов API на бэкенд
    // Однако для демонстрационных целей генерируем моковые данные
    return this.http.get<ScheduleStatistics>(`${this.apiUrl}/statistics/schedule`, { params })
      .pipe(
        catchError(() => {
          // В случае ошибки или отсутствия API, возвращаем моковые данные
          console.log('Использую моковые данные для статистики');
          return of(this.generateMockStatistics(request));
        })
      );
  }

  /**
   * Генерация моковых данных для статистики
   * @param request - параметры запроса
   */
  private generateMockStatistics(request: StatisticsRequest): ScheduleStatistics {
    // Базовые значения статистики
    const baseStatistics = {
      totalSlots: 100,
      totalAppointments: 65,
      completedAppointments: 30,
      waitingAppointments: 25,
      cancelledAppointments: 10,
      occupancyRate: 65,
      hourlyDistribution: [
        { hour: '08:00-09:00', totalAppointments: 5, rate: 50 },
        { hour: '09:00-10:00', totalAppointments: 8, rate: 80 },
        { hour: '10:00-11:00', totalAppointments: 10, rate: 100 },
        { hour: '11:00-12:00', totalAppointments: 7, rate: 70 },
        { hour: '12:00-13:00', totalAppointments: 3, rate: 30 },
        { hour: '13:00-14:00', totalAppointments: 2, rate: 20 },
        { hour: '14:00-15:00', totalAppointments: 6, rate: 60 },
        { hour: '15:00-16:00', totalAppointments: 9, rate: 90 },
        { hour: '16:00-17:00', totalAppointments: 8, rate: 80 },
        { hour: '17:00-18:00', totalAppointments: 7, rate: 70 }
      ]
    };
    
    // Модифицируем значения в зависимости от периода
    const multiplier = this.getPeriodMultiplier(request.period);
    
    return {
      ...baseStatistics,
      totalSlots: baseStatistics.totalSlots * multiplier,
      totalAppointments: Math.floor(baseStatistics.totalAppointments * multiplier),
      completedAppointments: Math.floor(baseStatistics.completedAppointments * multiplier),
      waitingAppointments: Math.floor(baseStatistics.waitingAppointments * multiplier),
      cancelledAppointments: Math.floor(baseStatistics.cancelledAppointments * multiplier),
      // Загруженность оставляем примерно такой же
      occupancyRate: Math.min(100, baseStatistics.occupancyRate * (1 + (Math.random() * 0.2 - 0.1)))
    };
  }

  /**
   * Получение множителя статистики в зависимости от выбранного периода
   */
  private getPeriodMultiplier(period: string): number {
    switch (period) {
      case 'day': 
        return 1;
      case 'week': 
        return 7;
      case 'month': 
        return 30;
      case 'threeMonths': 
        return 90;
      case 'year': 
        return 365;
      default: 
        return 1;
    }
  }
} 