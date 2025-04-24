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
    
    // Симуляция получения данных с сервера
    const mockSettings = this.lastSettings || this.getDefaultSettings(doctorId);
    return of(mockSettings).pipe(delay(500)); // Имитация задержки сети
    
    // Реализация для бэкенда
    // return this.http.get<ScheduleSettings>(`${this.apiUrl}/settings/${doctorId}`);
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
      lunchEnd: '14:00'
    };
  }

  // Сохранить настройки расписания
  saveDoctorScheduleSettings(settings: ScheduleSettings): Observable<ScheduleSettings> {
    // Сохраняем настройки для использования в других методах
    this.lastSettings = { ...settings };
    console.log('Сохранены настройки:', this.lastSettings);
    
    // Заглушка
    return of(settings);

    // Реализация для бэкенда
    // return this.http.post<ScheduleSettings>(`${this.apiUrl}/schedule/settings`, settings);
  }

  // Получить расписание врача с временными слотами
  getDoctorSchedule(doctorId: number, startDate: string, endDate: string): Observable<DoctorScheduleView> {
    console.log('Получение расписания для врача', doctorId);
    
    // Симуляция получения данных
    const settings = this.lastSettings || this.getDefaultSettings(doctorId);
    console.log('Используемые настройки:', settings);
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dayCount = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    
    // Инициализируем объект расписания
    const scheduleByDate: {[date: string]: TimeSlot[]} = {};
    
    const schedule: DoctorScheduleView = {
      doctorId,
      doctorName: 'Доктор №' + doctorId,
      specialization: 'Терапевт',
      timeSlots: [],
      schedule: scheduleByDate // Используем предварительно инициализированный объект
    };
    
    // Массив рабочих дней (0 = воскресенье, 1 = понедельник, ..., 6 = суббота)
    const workDays = settings.workDays.split(',').map((day: string) => parseInt(day.trim()));
    console.log('Рабочие дни:', workDays);
    
    // Обеденный перерыв
    const lunchStartParts = settings.lunchStart ? settings.lunchStart.split(':') : ['13', '00'];
    const lunchStart = {
      hours: parseInt(lunchStartParts[0]),
      minutes: parseInt(lunchStartParts[1])
    };
    
    const lunchEndParts = settings.lunchEnd ? settings.lunchEnd.split(':') : ['14', '00'];
    const lunchEnd = {
      hours: parseInt(lunchEndParts[0]),
      minutes: parseInt(lunchEndParts[1])
    };
    
    // Начало и конец рабочего дня
    const workdayStartParts = settings.workdayStart.split(':');
    const workdayStartHours = parseInt(workdayStartParts[0]);
    const workdayStartMinutes = parseInt(workdayStartParts[1]);

    const workdayEndParts = settings.workdayEnd.split(':');
    const workdayEndHours = parseInt(workdayEndParts[0]);
    const workdayEndMinutes = parseInt(workdayEndParts[1]);
    
    // Продолжительность слота в минутах
    const slotDuration = settings.slotDuration;
    console.log(`Генерация слотов с ${settings.workdayStart} до ${settings.workdayEnd}, длительность: ${slotDuration} минут`);
    
    // Генерация временных слотов для каждого дня в периоде
    for (let i = 0; i < dayCount; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      
      // Проверяем, является ли текущий день рабочим
      // JavaScript: 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
      const dayOfWeek = currentDate.getDay();
      console.log(`День ${currentDate.toISOString().split('T')[0]}, день недели: ${dayOfWeek}`);
      
      if (workDays.includes(dayOfWeek)) {
        console.log(`${currentDate.toISOString().split('T')[0]} - рабочий день`);
        
        // Генерация временных слотов для текущего дня
        let currentHour = workdayStartHours;
        let currentMinutes = workdayStartMinutes;
        
        // Пока текущее время не превысит конец рабочего дня
        while (
          currentHour < workdayEndHours || 
          (currentHour === workdayEndHours && currentMinutes < workdayEndMinutes)
        ) {
          // Проверка на обеденный перерыв
          const isLunchTime = settings.lunchBreak && 
            ((currentHour > lunchStart.hours || 
              (currentHour === lunchStart.hours && currentMinutes >= lunchStart.minutes)) &&
             (currentHour < lunchEnd.hours || 
              (currentHour === lunchEnd.hours && currentMinutes < lunchEnd.minutes)));
          
          if (!isLunchTime) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
            const dateString = currentDate.toISOString().split('T')[0];
            
            const slot: TimeSlot = {
              id: Math.floor(Math.random() * 10000),
              doctorId,
              date: dateString,
              time: timeString,
              duration: slotDuration,
              isAvailable: true, // По умолчанию слот доступен
              isTaken: false // По умолчанию слот не занят
            };
            
            schedule.timeSlots.push(slot);
            
            // Добавляем слот в расписание по дням
            if (!scheduleByDate[dateString]) {
              scheduleByDate[dateString] = [];
            }
            scheduleByDate[dateString].push(slot);
          } else {
            console.log('Пропуск обеденного перерыва:', 
                       `${currentHour.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`);
          }
          
          // Переход к следующему временному слоту
          currentMinutes += slotDuration;
          if (currentMinutes >= 60) {
            currentHour += Math.floor(currentMinutes / 60);
            currentMinutes = currentMinutes % 60;
          }
        }
      } else {
        console.log(`${currentDate.toISOString().split('T')[0]} - выходной день`);
      }
    }
    
    console.log('Сгенерировано слотов:', schedule.timeSlots.length);
    return of(schedule).pipe(delay(500)); // Имитация задержки сети
    
    // Реализация для бэкенда
    // return this.http.get<DoctorScheduleView>(`${this.apiUrl}/schedule/${doctorId}?startDate=${startDate}&endDate=${endDate}`);
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
      isAvailable: isAvailable,
      isTaken: false
    };
    return of(mockSlot);
    
    // Реализация для бэкенда
    // return this.http.patch<TimeSlot>(`${this.apiUrl}/timeslot/${slotId}`, { isAvailable });
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

  // Сгенерировать расписание для врача на указанный период
  generateSchedule(doctorId: number, startDate: string, endDate: string, settings?: ScheduleSettings): Observable<DoctorScheduleView> {
    console.log(`Генерация расписания для врача ${doctorId} с ${startDate} по ${endDate}`);
    
    // Используем переданные настройки или сохраненные ранее
    const settingsToUse = settings || this.lastSettings;
    console.log('Используя настройки:', settingsToUse);
    
    if (!settingsToUse) {
      return throwError(() => new Error('Не найдены настройки расписания доктора'));
    }
    
    // Сохраняем настройки для использования в других методах
    this.lastSettings = { ...settingsToUse };
    
    // Используем тот же метод формирования расписания, что и в getDoctorSchedule
    return this.getDoctorSchedule(doctorId, startDate, endDate);
    
    // Реализация для бэкенда
    // return this.http.post<DoctorScheduleView>(`${this.apiUrl}/schedule/generate`, {
    //   doctorId: doctorId,
    //   startDate: startDate,
    //   endDate: endDate,
    //   settings: settingsToUse
    // });
  }
  
  // Автоматическая генерация расписания по шаблону
  generateAutomaticSchedule(
    doctorId: number, 
    startDate: string, 
    endDate: string, 
    settings: ScheduleSettings
  ): Observable<DoctorScheduleView> {
    // Сохраняем настройки для использования в других методах
    this.lastSettings = { ...settings };
    console.log('Настройки для автоматической генерации:', this.lastSettings);
    
    // Используем настройки для генерации расписания
    return this.getDoctorSchedule(doctorId, startDate, endDate);
    
    // Реализация для бэкенда
    // return this.http.post<DoctorScheduleView>(
    //   `${this.apiUrl}/schedule/generate-automatic`, 
    //   { doctorId, startDate, endDate, settings }
    // );
  }

  // Обновить расписание для конкретного дня
  updateDaySchedule(doctorId: number, date: string, slots: {id: number, isAvailable: boolean}[]): Observable<void> {
    console.log(`Обновление расписания для врача ${doctorId} на дату ${date}`, slots);
    
    // Заглушка - имитируем успешное обновление
    return of(void 0).pipe(delay(500));
    
    // Реализация для бэкенда
    // return this.http.patch<void>(`${this.apiUrl}/schedule/${doctorId}/day/${date}`, { slots });
  }
} 