import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TimeSlot, ScheduleSettings, DoctorScheduleView } from '../../shared/interfaces/schedule.interface';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  // Получить настройки расписания для врача
  getDoctorScheduleSettings(doctorId: number): Observable<ScheduleSettings> {
    // Заглушка для разработки
    const mockSettings: ScheduleSettings = {
      doctorId: doctorId,
      workdayStart: '09:00',
      workdayEnd: '18:00',
      slotDuration: 30,
      breakDuration: 5,
      workDays: [1, 2, 3, 4, 5] // Пн-Пт
    };
    return of(mockSettings);

    // Реализация для бэкенда
    // return this.http.get<ScheduleSettings>(`${this.apiUrl}/schedule/settings/${doctorId}`);
  }

  // Сохранить настройки расписания
  saveDoctorScheduleSettings(settings: ScheduleSettings): Observable<ScheduleSettings> {
    // Заглушка
    return of(settings);

    // Реализация для бэкенда
    // return this.http.post<ScheduleSettings>(`${this.apiUrl}/schedule/settings`, settings);
  }

  // Получить расписание врача на период
  getDoctorSchedule(doctorId: number, startDate: string, endDate: string): Observable<DoctorScheduleView> {
    // Заглушка с генерацией временных интервалов
    const mockSchedule: DoctorScheduleView = {
      doctorId: doctorId,
      doctorName: 'Доктор Иванов',
      specialization: 'Терапевт',
      schedule: {}
    };

    // Генерируем временные слоты для примера
    const currentDate = new Date(startDate);
    const end = new Date(endDate);
    
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      
      // Пропускаем выходные дни
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }
      
      mockSchedule.schedule[dateStr] = [];
      
      // Заполняем рабочий день слотами
      let startTime = new Date(dateStr + 'T09:00:00');
      const endTime = new Date(dateStr + 'T18:00:00');
      
      let slotId = 1;
      while (startTime < endTime) {
        const timeStr = startTime.toTimeString().substring(0, 5);
        mockSchedule.schedule[dateStr].push({
          id: slotId++,
          doctorId: doctorId,
          date: dateStr,
          time: timeStr,
          duration: 30,
          isAvailable: Math.random() > 0.3 // Случайно отмечаем некоторые слоты как занятые
        });
        
        // Добавляем 30 минут к времени
        startTime = new Date(startTime.getTime() + 30 * 60000);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return of(mockSchedule);
    
    // Реализация для бэкенда
    // return this.http.get<DoctorScheduleView>(
    //   `${this.apiUrl}/schedule/${doctorId}?startDate=${startDate}&endDate=${endDate}`
    // );
  }

  // Обновить доступность слота
  updateSlotAvailability(slotId: number, isAvailable: boolean): Observable<TimeSlot> {
    // Заглушка
    const mockSlot: TimeSlot = {
      id: slotId,
      doctorId: 1,
      date: '2023-07-10',
      time: '10:00',
      duration: 30,
      isAvailable: isAvailable
    };
    return of(mockSlot);
    
    // Реализация для бэкенда
    // return this.http.patch<TimeSlot>(
    //   `${this.apiUrl}/schedule/slots/${slotId}`, 
    //   { isAvailable: isAvailable }
    // );
  }

  // Создать новый слот
  createTimeSlot(slot: Omit<TimeSlot, 'id'>): Observable<TimeSlot> {
    // Заглушка
    const newSlot: TimeSlot = {
      ...slot,
      id: Math.floor(Math.random() * 1000)
    };
    return of(newSlot);
    
    // Реализация для бэкенда
    // return this.http.post<TimeSlot>(`${this.apiUrl}/schedule/slots`, slot);
  }

  // Удалить слот
  deleteTimeSlot(slotId: number): Observable<void> {
    // Заглушка
    return of(void 0);
    
    // Реализация для бэкенда
    // return this.http.delete<void>(`${this.apiUrl}/schedule/slots/${slotId}`);
  }

  // Сгенерировать расписание автоматически
  generateSchedule(
    doctorId: number, 
    startDate: string, 
    endDate: string, 
    settings: ScheduleSettings
  ): Observable<DoctorScheduleView> {
    // Заглушка - просто вызываем getDoctorSchedule
    return this.getDoctorSchedule(doctorId, startDate, endDate);
    
    // Реализация для бэкенда
    // return this.http.post<DoctorScheduleView>(
    //   `${this.apiUrl}/schedule/generate`, 
    //   { doctorId, startDate, endDate, settings }
    // );
  }
} 