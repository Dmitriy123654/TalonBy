import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ScheduleService } from '../../../core/services/schedule.service';
import { DoctorScheduleView, ScheduleSettings, TimeSlot } from '../../../shared/interfaces/schedule.interface';

@Component({
  selector: 'app-schedule-management',
  templateUrl: './schedule-management.component.html',
  styleUrls: ['./schedule-management.component.scss']
})
export class ScheduleManagementComponent implements OnInit {
  // Настройки расписания
  settingsForm: FormGroup;
  // Выбранный доктор
  selectedDoctorId: number = 1; // Временно установлено фиксированное значение
  // Текущее расписание
  currentSchedule: DoctorScheduleView | null = null;
  // Дата начала периода
  startDate: string;
  // Дата окончания периода
  endDate: string;
  // Состояние загрузки
  isLoading: boolean = false;
  // Сообщение об ошибке
  errorMessage: string = '';
  // Флаг успешного сохранения
  saveSuccess: boolean = false;
  // Список всех врачей (будет загружаться с сервера)
  doctors = [
    { id: 1, name: 'Иванов И.И.', specialization: 'Терапевт' },
    { id: 2, name: 'Петров П.П.', specialization: 'Хирург' },
    { id: 3, name: 'Сидорова С.С.', specialization: 'Кардиолог' }
  ];
  // Дни недели для отображения
  weekdays = [
    { id: 0, name: 'Воскресенье' },
    { id: 1, name: 'Понедельник' },
    { id: 2, name: 'Вторник' },
    { id: 3, name: 'Среда' },
    { id: 4, name: 'Четверг' },
    { id: 5, name: 'Пятница' },
    { id: 6, name: 'Суббота' }
  ];

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService
  ) {
    // Инициализация форм и периода
    const today = new Date();
    this.startDate = this.formatDate(today);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    this.endDate = this.formatDate(nextWeek);
    
    this.settingsForm = this.fb.group({
      workdayStart: ['09:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      workdayEnd: ['18:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      slotDuration: [30, [Validators.required, Validators.min(5), Validators.max(120)]],
      breakDuration: [5, [Validators.required, Validators.min(0), Validators.max(60)]],
      workDays: [this.fb.array([1, 2, 3, 4, 5]), Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadDoctorSettings();
  }

  // Загрузка настроек расписания для выбранного врача
  loadDoctorSettings(): void {
    this.isLoading = true;
    this.scheduleService.getDoctorScheduleSettings(this.selectedDoctorId).subscribe({
      next: (settings) => {
        this.settingsForm.patchValue({
          workdayStart: settings.workdayStart,
          workdayEnd: settings.workdayEnd,
          slotDuration: settings.slotDuration,
          breakDuration: settings.breakDuration,
          workDays: settings.workDays
        });
        
        // После загрузки настроек загружаем расписание
        this.loadSchedule();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка при загрузке настроек расписания';
        console.error('Ошибка загрузки настроек:', error);
      }
    });
  }

  // Загрузка текущего расписания
  loadSchedule(): void {
    this.isLoading = true;
    this.scheduleService.getDoctorSchedule(
      this.selectedDoctorId, 
      this.startDate, 
      this.endDate
    ).subscribe({
      next: (schedule) => {
        this.currentSchedule = schedule;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка при загрузке расписания';
        console.error('Ошибка загрузки расписания:', error);
      }
    });
  }

  // Сохранение настроек расписания
  saveSettings(): void {
    if (this.settingsForm.invalid) {
      this.errorMessage = 'Пожалуйста, исправьте ошибки в форме';
      return;
    }
    
    this.isLoading = true;
    const settings: ScheduleSettings = {
      doctorId: this.selectedDoctorId,
      ...this.settingsForm.value
    };
    
    this.scheduleService.saveDoctorScheduleSettings(settings).subscribe({
      next: () => {
        this.saveSuccess = true;
        this.errorMessage = '';
        this.isLoading = false;
        
        // Автоматически сбрасываем сообщение об успехе через 3 секунды
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка при сохранении настроек';
        console.error('Ошибка сохранения настроек:', error);
      }
    });
  }

  // Генерация расписания на выбранный период
  generateSchedule(): void {
    if (this.settingsForm.invalid) {
      this.errorMessage = 'Пожалуйста, исправьте ошибки в форме настроек';
      return;
    }
    
    this.isLoading = true;
    const settings: ScheduleSettings = {
      doctorId: this.selectedDoctorId,
      ...this.settingsForm.value
    };
    
    this.scheduleService.generateSchedule(
      this.selectedDoctorId,
      this.startDate,
      this.endDate,
      settings
    ).subscribe({
      next: (schedule) => {
        this.currentSchedule = schedule;
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка при генерации расписания';
        console.error('Ошибка генерации расписания:', error);
      }
    });
  }

  // Обновление доступности слота
  updateSlotAvailability(slot: TimeSlot, isAvailable: boolean): void {
    this.isLoading = true;
    this.scheduleService.updateSlotAvailability(slot.id, isAvailable).subscribe({
      next: (updatedSlot) => {
        // Обновляем слот в текущем расписании
        if (this.currentSchedule && this.currentSchedule.schedule[updatedSlot.date]) {
          const index = this.currentSchedule.schedule[updatedSlot.date].findIndex(s => s.id === updatedSlot.id);
          if (index !== -1) {
            this.currentSchedule.schedule[updatedSlot.date][index] = updatedSlot;
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка при обновлении слота';
        console.error('Ошибка обновления слота:', error);
      }
    });
  }

  // Изменение доктора
  onDoctorChange(doctorId: number): void {
    this.selectedDoctorId = doctorId;
    this.loadDoctorSettings();
  }

  // Изменение периода
  onPeriodChange(): void {
    this.loadSchedule();
  }

  // Форматирование даты в строку YYYY-MM-DD
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Получение отсортированных дат из расписания
  getSortedDates(): string[] {
    if (!this.currentSchedule || !this.currentSchedule.schedule) {
      return [];
    }
    
    return Object.keys(this.currentSchedule.schedule).sort();
  }

  // Форматирование даты для отображения (ДД.ММ.ГГГГ)
  formatDisplayDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}`;
  }

  // Получение дня недели для даты
  getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    const dayIndex = date.getDay();
    return this.weekdays[dayIndex].name;
  }

  // Проверка, выбран ли день недели
  isDaySelected(dayId: number): boolean {
    return this.settingsForm.value.workDays.includes(dayId);
  }

  // Переключение выбора дня недели
  toggleDay(dayId: number): void {
    const workDays = [...this.settingsForm.value.workDays];
    const index = workDays.indexOf(dayId);
    
    if (index === -1) {
      workDays.push(dayId);
    } else {
      workDays.splice(index, 1);
    }
    
    this.settingsForm.patchValue({ workDays });
  }
} 