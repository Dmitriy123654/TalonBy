import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TimeSlot, ScheduleSettings, DoctorScheduleView } from '../../shared/interfaces/schedule.interface';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = environment.apiUrl;
  // Храним последние настройки для использования в генерации
  private lastSettings: ScheduleSettings | null = null;

  constructor(private http: HttpClient) { }

  // Получить настройки расписания для врача
  getDoctorScheduleSettings(doctorId: number): Observable<ScheduleSettings> {
    console.log('Получение настроек расписания для врача', doctorId);
    
    // Реализация для бэкенда
    return this.http.get<ScheduleSettings>(`${this.apiUrl}/schedule/settings/${doctorId}`);
  }

  // Получить дефолтные настройки расписания
  private getDefaultSettings(doctorId: number): ScheduleSettings {
    return {
      doctorId: doctorId,
      workdayStart: '09:00',
      workdayEnd: '18:00',
      slotDuration: 30,
      breakDuration: 5,
      workDays: '1,2,3,4,5', // Пн-Пт
      lunchBreak: true,
      lunchStart: '13:00',
      lunchEnd: '14:00',
      hospitalId: 1 // Заглушка для hospitalId
    };
  }

  // Преобразовать строку workDays в массив чисел для бэкенда
  private formatWorkDaysForBackend(settings: ScheduleSettings): any {
    if (!settings) return null;
    
    const backendSettings = { ...settings };
    
    // Строка workDays остается строкой - убираем преобразование в массив
    if (typeof settings.workDays === 'string') {
      // Просто очищаем строку от лишних пробелов
      backendSettings.workDays = settings.workDays.split(',')
        .map(day => day.trim())
        .filter(day => day !== '')
        .join(',');
    }
    
    return backendSettings;
  }

  // Сохранить настройки расписания
  saveDoctorScheduleSettings(settings: ScheduleSettings): Observable<ScheduleSettings> {
    // Убедимся, что ID врача и больницы указаны
    if (!settings.doctorId) {
      settings.doctorId = 5; // Заглушка для doctorId
    }
    
    if (!settings.hospitalId) {
      settings.hospitalId = 1; // Заглушка для hospitalId
    }
    
    // Сохраняем настройки для использования в других методах
    this.lastSettings = { ...settings };
    console.log('Сохранены настройки:', this.lastSettings);
    
    // Форматируем данные перед отправкой в API
    const formattedSettings = this.formatWorkDaysForBackend(settings);
    console.log('Форматированные настройки для API:', formattedSettings);
    
    // Реализация для бэкенда
    return this.http.post<ScheduleSettings>(`${this.apiUrl}/schedule/settings`, formattedSettings);
  }

  // Получить расписание врача с временными слотами
  getDoctorSchedule(doctorId: number, startDate: string, endDate: string): Observable<DoctorScheduleView> {
    console.log('Получение расписания для врача', doctorId);
    
    // Реализация для бэкенда
    return this.http.get<DoctorScheduleView>(`${this.apiUrl}/schedule/${doctorId}?startDate=${startDate}&endDate=${endDate}`);
  }

  // Обновить доступность слота
  updateSlotAvailability(slotId: number, isAvailable: boolean): Observable<TimeSlot> {
    // Реализация для бэкенда
    return this.http.patch<TimeSlot>(`${this.apiUrl}/schedule/slots/${slotId}`, { slotId, isAvailable });
  }

  // Создать новый слот
  createTimeSlot(slot: Omit<TimeSlot, 'id'>): Observable<TimeSlot> {
    // Реализация для бэкенда
    return this.http.post<TimeSlot>(`${this.apiUrl}/schedule/slots`, slot);
  }

  // Удалить слот
  deleteTimeSlot(slotId: number): Observable<void> {
    // Реализация для бэкенда
    return this.http.delete<void>(`${this.apiUrl}/schedule/slots/${slotId}`);
  }

  // Сгенерировать расписание для врача на указанный период
  generateSchedule(doctorId: number, startDate: string, endDate: string, settings?: ScheduleSettings): Observable<DoctorScheduleView> {
    console.log(`Генерация расписания для врача ${doctorId} с ${startDate} по ${endDate}`);
    
    // Используем переданные настройки или сохраненные ранее или дефолтные
    const settingsToUse = settings || this.lastSettings || this.getDefaultSettings(doctorId);
    console.log('Используя настройки:', settingsToUse);
    
    // Убедимся, что ID врача и больницы указаны
    if (!settingsToUse.doctorId) {
      settingsToUse.doctorId = 5; // Заглушка для doctorId
    }
    
    if (!settingsToUse.hospitalId) {
      settingsToUse.hospitalId = 1; // Заглушка для hospitalId
    }
    
    // Форматируем настройки перед отправкой
    const formattedSettings = this.formatWorkDaysForBackend(settingsToUse);
    
    // Реализация для бэкенда
    return this.http.post<DoctorScheduleView>(`${this.apiUrl}/schedule/generate`, {
      doctorId: doctorId || 5, // Заглушка для doctorId
      startDate: startDate,
      endDate: endDate,
      settings: formattedSettings
    });
  }
  
  // Автоматическая генерация расписания по шаблону
  generateAutomaticSchedule(
    doctorId: number, 
    startDate: string, 
    endDate: string, 
    settings: ScheduleSettings
  ): Observable<DoctorScheduleView> {
    // Убедимся, что ID врача и больницы указаны
    if (!settings.doctorId) {
      settings.doctorId = 5; // Заглушка для doctorId
    }
    
    if (!settings.hospitalId) {
      settings.hospitalId = 1; // Заглушка для hospitalId
    }
    
    // Форматируем настройки перед отправкой
    const formattedSettings = this.formatWorkDaysForBackend(settings);
    
    // Реализация для бэкенда
    return this.http.post<DoctorScheduleView>(
      `${this.apiUrl}/schedule/generate-automatic`, 
      { 
        doctorId: doctorId || 5, // Заглушка для doctorId
        startDate, 
        endDate, 
        settings: formattedSettings 
      }
    );
  }

  // Обновить расписание для конкретного дня
  updateDaySchedule(doctorId: number, date: string, slots: {id: number, isAvailable: boolean}[]): Observable<void> {
    // Преобразуем формат слотов
    const formattedSlots = slots.map(slot => ({
      slotId: slot.id,
      isAvailable: slot.isAvailable
    }));
    
    // Реализация для бэкенда
    return this.http.patch<void>(`${this.apiUrl}/schedule/${doctorId}/day/${date}`, formattedSlots);
  }
} 