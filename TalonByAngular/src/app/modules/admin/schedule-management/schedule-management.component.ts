import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ScheduleService } from '../../../core/services/schedule.service';
import { DoctorScheduleView, ScheduleSettings, TimeSlot, Hospital } from '../../../shared/interfaces/schedule.interface';
import { AuthService } from '../../../core/services/auth.service';
import { OrderService } from '../../../core/services/order.service';
import { Hospital as OrderHospital, DoctorDetails } from '../../../shared/interfaces/order.interface';

@Component({
  selector: 'app-schedule-management',
  templateUrl: './schedule-management.component.html',
  styleUrls: ['./schedule-management.component.scss']
})
export class ScheduleManagementComponent implements OnInit {
  // Настройки расписания
  settingsForm: FormGroup;
  // Выбранный доктор
  selectedDoctorId: number = 0;
  // Выбранная больница (для администраторов)
  selectedHospitalId: number = 0;
  // Текущее расписание
  currentSchedule: DoctorScheduleView | null = null;
  // Последние сохраненные настройки
  lastSettings: ScheduleSettings | null = null;
  // Дата начала периода
  startDate: string;
  // Дата окончания периода
  endDate: string;
  // Максимальная дата (текущая + 3 месяца)
  maxEndDate: string;
  // Состояние загрузки
  isLoading: boolean = false;
  // Сообщение об ошибке
  errorMessage: string = '';
  // Флаг успешного сохранения
  saveSuccess: boolean = false;
  // Роль пользователя
  userRole: string = '';
  // Доступные перерывы между приемами
  breakOptions = [0, 5, 10];
  // Флаг автоматической генерации
  autoGenerateEnabled: boolean = false;
  // Список всех врачей (будет загружаться с сервера)
  doctors = [
    { id: 1, name: 'Иванов И.И.', specialization: 'Терапевт' },
    { id: 2, name: 'Петров П.П.', specialization: 'Хирург' },
    { id: 3, name: 'Сидорова С.С.', specialization: 'Кардиолог' }
  ];
  // Список больниц (для администраторов)
  hospitals: OrderHospital[] = [];
  // Список специальностей выбранной больницы
  specialities: any[] = [];
  // Выбранная специальность
  selectedSpecialityId: number = 0;
  
  // Фильтры для поиска
  hospitalFilter: string = '';
  specialityFilter: string = '';
  doctorFilter: string = '';
  
  // Исходные списки (до фильтрации)
  allHospitals: OrderHospital[] = [];
  allSpecialities: any[] = [];
  allDoctors: DoctorDetails[] = [];
  
  // Дни недели для отображения
  weekdays = [
    { id: 1, name: 'Понедельник' },
    { id: 2, name: 'Вторник' },
    { id: 3, name: 'Среда' },
    { id: 4, name: 'Четверг' },
    { id: 5, name: 'Пятница' },
    { id: 6, name: 'Суббота' },
    { id: 7, name: 'Воскресенье' }
  ];

  // Календарь
  calendarWeekDays = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
  months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  currentMonth: Date = new Date();
  calendarDays: any[][] = [];
  selectedCalendarDate: Date | null = null;
  selectedDaySlots: TimeSlot[] = [];

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private authService: AuthService,
    private orderService: OrderService
  ) {
    // Инициализируем форму с дефолтными значениями для решения ошибки линтера
    this.settingsForm = this.fb.group({
      workdayStart: ['10:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      workdayEnd: ['18:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      slotDuration: [15, [Validators.required, Validators.min(5), Validators.max(60)]],
      breakDuration: [5, [Validators.required, Validators.min(0), Validators.max(10)]],
      lunchStart: ['13:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      lunchEnd: ['14:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      workDays: [[1, 2, 3, 4, 5, 6], Validators.required], // По умолчанию ПН-СБ
      doctorId: [this.selectedDoctorId], // Используем выбранный
      hospitalId: [this.selectedHospitalId] // Используем выбранный
    }, { validators: [this.validateLunchBreak, this.validateWorkHours] });
    
    // Инициализация дат
    const today = new Date();
    this.startDate = this.formatDate(today);
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    this.endDate = this.formatDate(nextWeek);
    
    // Установка максимального периода (сегодня + 3 месяца)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxEndDate = this.formatDate(maxDate);
    
    // Получение роли пользователя
    this.getUserRole();
  }

  ngOnInit(): void {
    this.initializeByRole();
    
    // Добавляем инициализацию календаря даже без данных
    this.buildEmptyCalendar();
  }

  // Валидация: обеденный перерыв не должен превышать 2 часа
  validateLunchBreak(control: AbstractControl): ValidationErrors | null {
    const lunchStart = control.get('lunchStart')?.value;
    const lunchEnd = control.get('lunchEnd')?.value;
    
    if (!lunchStart || !lunchEnd) return null;
    
    const start = ScheduleManagementComponent.timeToMinutes(lunchStart);
    const end = ScheduleManagementComponent.timeToMinutes(lunchEnd);
    
    // Обеденный перерыв не должен превышать 2 часа (120 минут)
    if (end - start > 120) {
      return { lunchTooLong: true };
    }
    
    if (end <= start) {
      return { invalidLunchTime: true };
    }
    
    return null;
  }
  
  // Валидация рабочих часов (конец должен быть позже начала)
  validateWorkHours(control: AbstractControl): ValidationErrors | null {
    const workdayStart = control.get('workdayStart')?.value;
    const workdayEnd = control.get('workdayEnd')?.value;
    
    if (!workdayStart || !workdayEnd) return null;
    
    const start = ScheduleManagementComponent.timeToMinutes(workdayStart);
    const end = ScheduleManagementComponent.timeToMinutes(workdayEnd);
    
    if (end <= start) {
      return { invalidWorkHours: true };
    }
    
    return null;
  }
  
  // Преобразование времени в минуты для упрощения сравнения
  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
  
  // Получение роли пользователя из сервиса авторизации
  getUserRole(): void {
    // Получаем информацию о пользователе из AuthService
    const userInfo = this.authService.getUserInfo();
    // Если информация есть, берем роль
    if (userInfo && userInfo.role) {
      this.userRole = userInfo.role;
    } else {
      // По умолчанию - обычный пользователь
      this.userRole = 'Patient';
    }
  }
  
  // Инициализация компонента в зависимости от роли пользователя
  initializeByRole(): void {
    // Проверка административного доступа
    if (this.authService.hasAdminAccess()) {
      // Для администраторов загружаем список всех больниц
      this.loadHospitals();
    } else if (this.userRole === 'Doctor') {
      // Если пользователь - врач, загружаем только его расписание
      const userInfo = this.authService.getUserInfo();
      // Преобразуем строковый id в число
      const doctorId = userInfo ? parseInt(userInfo.userId, 10) : 1;
      this.selectedDoctorId = doctorId || 1; // Если не получилось преобразовать, используем 1
      this.loadDoctorSettings(this.selectedDoctorId);
    } else if (this.userRole === 'Registrar') {
      // Если пользователь - регистратор, загружаем доступных врачей его больницы
      this.loadHospitalDoctors(this.selectedHospitalId);
    } else {
      // Для других ролей - ограниченный доступ или перенаправление
      this.errorMessage = 'У вас нет прав для управления расписанием';
    }
  }
  
  // Загрузка списка больниц
  loadHospitals(): void {
    this.isLoading = true;
    this.orderService.getHospitals().subscribe({
      next: (data) => {
        this.allHospitals = data;
        this.hospitals = [...data];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Ошибка при загрузке списка больниц';
        this.isLoading = false;
        console.error('Ошибка загрузки больниц:', error);
      }
    });
  }
  
  // Загрузка специальностей по ID больницы
  loadSpecialities(hospitalId: number): void {
    this.isLoading = true;
    this.orderService.getSpecialities(hospitalId).subscribe({
      next: (data) => {
        this.allSpecialities = data;
        this.specialities = [...data];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Ошибка при загрузке списка специальностей';
        this.isLoading = false;
        console.error('Ошибка загрузки специальностей:', error);
      }
    });
  }
  
  // Загрузка врачей по специальности и больнице
  loadDoctorsBySpeciality(hospitalId: number, specialityId: number): void {
    this.isLoading = true;
    this.orderService.getDoctorsBySpecialityAndHospital(hospitalId, specialityId).subscribe({
      next: (data) => {
        this.allDoctors = data;
        // Преобразуем данные в требуемый формат
        this.doctors = data.map(doctor => ({
          id: doctor.doctorId,
          name: doctor.fullName,
          specialization: doctor.doctorsSpeciality?.name || ''
        }));
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Ошибка при загрузке списка врачей';
        this.isLoading = false;
        console.error('Ошибка загрузки врачей:', error);
      }
    });
  }
  
  // Загрузка врачей конкретной больницы
  loadHospitalDoctors(hospitalId: number): void {
    // Здесь должен быть реальный запрос к API
    this.isLoading = true;
    // Пример:
    // this.scheduleService.getHospitalDoctors(hospitalId).subscribe(
    //   (data) => {
    //     this.doctors = data;
    //     this.isLoading = false;
    //   },
    //   (error) => {
    //     this.errorMessage = 'Ошибка при загрузке списка врачей';
    //     this.isLoading = false;
    //   }
    // );
    
    // Заглушка
    setTimeout(() => {
      this.isLoading = false;
    }, 500);
  }

  // Инициализация формы
  initForm(): void {
    this.settingsForm = this.fb.group({
      workdayStart: ['10:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      workdayEnd: ['18:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      slotDuration: [15, [Validators.required, Validators.min(5), Validators.max(60)]],
      breakDuration: [5, [Validators.required, Validators.min(0), Validators.max(10)]],
      lunchStart: ['13:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      lunchEnd: ['14:00', [Validators.required, Validators.pattern('^([01]?[0-9]|2[0-3]):[0-5][0-9]$')]],
      workDays: [[1, 2, 3, 4, 5, 6], Validators.required], // По умолчанию ПН-СБ
      doctorId: [this.selectedDoctorId], // Используем выбранного врача
      hospitalId: [this.selectedHospitalId] // Используем выбранную больницу
    }, { validators: [this.validateLunchBreak, this.validateWorkHours] });
  }

  // Загрузка настроек расписания для выбранного врача
  loadDoctorSettings(doctorId: number): void {
    if (doctorId <= 0) {
      this.initForm();
      return;
    }
    
    this.isLoading = true;
    this.scheduleService.getDoctorScheduleSettings(doctorId).subscribe({
      next: (settings) => {
        // Преобразуем строку дней недели в массив чисел
        let workDaysArray: number[] = [];
        if (settings.workDays) {
          // Если workDays - строка, разбиваем по запятой и конвертируем в числа
          if (typeof settings.workDays === 'string') {
            workDaysArray = settings.workDays.split(',').map(day => parseInt(day.trim()));
          } 
          // Если workDays уже массив, используем его как есть
          else if (Array.isArray(settings.workDays)) {
            workDaysArray = settings.workDays;
          }
          // По умолчанию - пн-пт
          else {
            workDaysArray = [1, 2, 3, 4, 5];
          }
        } else {
          // По умолчанию - пн-пт
          workDaysArray = [1, 2, 3, 4, 5];
        }
        
        console.log('Загруженные рабочие дни (массив):', workDaysArray);
        
        // Сохраняем последние настройки
        this.lastSettings = { ...settings };
        
        this.settingsForm.patchValue({
          workdayStart: settings.workdayStart,
          workdayEnd: settings.workdayEnd,
          slotDuration: settings.slotDuration,
          breakDuration: settings.breakDuration,
          lunchStart: settings.lunchStart || '13:00',
          lunchEnd: settings.lunchEnd || '14:00',
          workDays: workDaysArray,
          doctorId: doctorId,
          hospitalId: this.selectedHospitalId
        });
        
        // После загрузки настроек загружаем расписание
        this.loadSchedule();
        
        // Скрыть сообщение об ошибке, если оно было
        this.errorMessage = '';
      },
      error: (error: any) => {
        // Если настроек нет, инициализируем форму значениями по умолчанию
        this.initForm();
        console.log('Настройки для врача не найдены, используются значения по умолчанию');
        
        // После инициализации формы загружаем расписание с дефолтными настройками
        this.loadSchedule();
        
        this.isLoading = false;
      }
    });
  }

  // Загрузка текущего расписания
  loadSchedule(): void {
    if (this.selectedDoctorId <= 0) {
      this.currentSchedule = null;
      this.buildEmptyCalendar();
      this.isLoading = false;
      return;
    }
    
    console.log('Загрузка расписания для врача:', this.selectedDoctorId);
    console.log('Период:', this.startDate, 'по', this.endDate);
    
    this.isLoading = true;
    this.currentSchedule = null; // Очищаем текущее расписание во время загрузки
    this.scheduleService.getDoctorSchedule(
      this.selectedDoctorId, 
      this.startDate, 
      this.endDate
    ).subscribe({
      next: (schedule) => {
        this.currentSchedule = schedule;
        
        // Устанавливаем текущий месяц на первый день из расписания, если он есть
        if (schedule && schedule.schedule) {
          const scheduleDates = Object.keys(schedule.schedule).sort();
          if (scheduleDates.length > 0) {
            const firstScheduleDate = new Date(scheduleDates[0]);
            this.currentMonth = new Date(firstScheduleDate.getFullYear(), firstScheduleDate.getMonth(), 1);
          }
        }
        
        this.isLoading = false;
        
        // Создаем календарное представление расписания
        this.buildCalendar();
        
        // Сбрасываем выбранную дату
        this.selectedCalendarDate = null;
        this.selectedDaySlots = [];
        
        console.log('Загруженное расписание:', schedule);
      },
      error: (error: any) => {
        this.isLoading = false;
        
        // Если расписания нет, строим пустой календарь
        if (error.status === 404) {
          console.log('Расписание не найдено для врача, отображаем пустой календарь');
          this.buildEmptyCalendar();
        } else {
          this.errorMessage = 'Ошибка при загрузке расписания';
          console.error('Ошибка загрузки расписания:', error);
          
          // Строим пустой календарь в случае ошибки
          this.buildEmptyCalendar();
        }
      }
    });
  }

  // Сохранение настроек расписания
  saveSettings(): void {
    if (this.settingsForm.invalid) {
      return;
    }
    
    // Проверка наличия выбранного врача
    if (this.selectedDoctorId <= 0) {
      this.errorMessage = 'Пожалуйста, выберите врача перед сохранением настроек';
      return;
    }
    
    this.isLoading = true;
    // Собираем данные из формы
    const formValues = this.settingsForm.value;
    
    // Преобразуем массив дней недели в строку через запятую
    const workDaysString = formValues.workDays.join(',');
    
    // Формируем объект настроек
    const settings: ScheduleSettings = {
      doctorId: this.selectedDoctorId,
      hospitalId: this.selectedHospitalId,
      workdayStart: formValues.workdayStart,
      workdayEnd: formValues.workdayEnd,
      slotDuration: formValues.slotDuration,
      breakDuration: formValues.breakDuration,
      lunchBreak: true, // Всегда включен обеденный перерыв
      lunchStart: formValues.lunchStart,
      lunchEnd: formValues.lunchEnd,
      workDays: workDaysString
    };
    
    console.log('Сохранение настроек:', settings);
    
    // Сохраняем настройки локально
    this.lastSettings = { ...settings };
    
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
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка при сохранении настроек';
        console.error('Ошибка сохранения настроек:', error);
      }
    });
  }

  // Генерация расписания на выбранный период
  generateSchedule(): void {
    if (this.settingsForm.invalid) {
      // Проверка специфических ошибок валидации
      if (this.settingsForm.errors?.['lunchTooLong']) {
        this.errorMessage = 'Обеденный перерыв не может быть более 2 часов';
        return;
      }
      
      if (this.settingsForm.errors?.['invalidLunchTime']) {
        this.errorMessage = 'Время окончания обеда должно быть позже времени начала';
        return;
      }
      
      if (this.settingsForm.errors?.['invalidWorkHours']) {
        this.errorMessage = 'Время окончания рабочего дня должно быть позже времени начала';
        return;
      }
      
      this.errorMessage = 'Пожалуйста, исправьте ошибки в форме настроек';
      return;
    }
    
    // Проверка наличия выбранного врача и больницы
    if (this.selectedDoctorId <= 0) {
      this.errorMessage = 'Пожалуйста, выберите врача перед генерацией расписания';
      return;
    }
    
    if (this.selectedHospitalId <= 0) {
      this.errorMessage = 'Пожалуйста, выберите больницу перед генерацией расписания';
      return;
    }
    
    // Дополнительная проверка времени обеденного перерыва
    const lunchStart = this.settingsForm.get('lunchStart')?.value;
    const lunchEnd = this.settingsForm.get('lunchEnd')?.value;
    
    if (lunchStart && lunchEnd) {
      const start = ScheduleManagementComponent.timeToMinutes(lunchStart);
      const end = ScheduleManagementComponent.timeToMinutes(lunchEnd);
      
      if (end - start > 120) {
        this.errorMessage = 'Обеденный перерыв не может быть более 2 часов';
        return;
      }
      
      if (end <= start) {
        this.errorMessage = 'Время окончания обеда должно быть позже времени начала';
        return;
      }
    }
    
    this.isLoading = true;
    const formValues = this.settingsForm.value;
    
    // Проверяем, что все необходимые поля имеют значения
    if (!formValues.workdayStart || !formValues.workdayEnd || 
        !formValues.slotDuration || formValues.breakDuration === undefined || 
        !formValues.workDays || !formValues.workDays.length) {
      this.errorMessage = 'Пожалуйста, заполните все поля формы';
      this.isLoading = false;
      return;
    }
    
    // Преобразуем массив рабочих дней в строку
    const workDaysString = Array.isArray(formValues.workDays) 
      ? formValues.workDays.join(',') 
      : formValues.workDays;
    
    const settings: ScheduleSettings = {
      doctorId: this.selectedDoctorId,
      hospitalId: this.selectedHospitalId,
      workdayStart: formValues.workdayStart,
      workdayEnd: formValues.workdayEnd,
      slotDuration: Number(formValues.slotDuration),
      breakDuration: Number(formValues.breakDuration),
      lunchStart: formValues.lunchStart,
      lunchEnd: formValues.lunchEnd,
      workDays: workDaysString,
      lunchBreak: true
    };
    
    console.log('Генерация расписания с настройками:', settings);
    console.log('Период:', this.startDate, 'по', this.endDate);
    
    // Выбираем метод генерации в зависимости от флага автоматической генерации
    const generateMethod = this.autoGenerateEnabled 
      ? this.scheduleService.generateAutomaticSchedule.bind(this.scheduleService)
      : this.scheduleService.generateSchedule.bind(this.scheduleService);
    
    this.errorMessage = '';
    this.saveSuccess = false;
    
    // Показываем индикатор загрузки и очищаем расписание
    this.isLoading = true;
    this.currentSchedule = null;
    
    generateMethod(
      this.selectedDoctorId,
      this.startDate,
      this.endDate,
      settings
    ).subscribe({
      next: (schedule) => {
        this.currentSchedule = schedule;
        
        // Устанавливаем текущий месяц на первый день из расписания
        if (schedule && schedule.schedule) {
          const scheduleDates = Object.keys(schedule.schedule).sort();
          if (scheduleDates.length > 0) {
            const firstScheduleDate = new Date(scheduleDates[0]);
            this.currentMonth = new Date(firstScheduleDate.getFullYear(), firstScheduleDate.getMonth(), 1);
          }
        }
        
        this.isLoading = false;
        this.saveSuccess = true;
        
        // Создаем календарное представление расписания
        this.buildCalendar();
        
        // Сбрасываем выбранную дату
        this.selectedCalendarDate = null;
        this.selectedDaySlots = [];
        
        console.log('Сгенерированное расписание:', schedule);
        
        // Скрываем сообщение об успехе через 3 секунды
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = "Ошибка генерации расписания: " + (error.error || error.message || JSON.stringify(error));
        console.error('Ошибка генерации расписания:', error);
      }
    });
  }

  // Обновление доступности слота
  updateSlotAvailability(slot: TimeSlot, isAvailable: boolean): void {
    if (!slot || !slot.id) {
      this.errorMessage = 'Ошибка: недействительный слот';
      return;
    }
    
    this.isLoading = true;
    this.scheduleService.updateSlotAvailability(slot.id, isAvailable).subscribe({
      next: (updatedSlot) => {
        // Обновляем слот в текущем расписании
        if (this.currentSchedule && this.currentSchedule.schedule && this.currentSchedule.schedule[updatedSlot.date]) {
          const index = this.currentSchedule.schedule[updatedSlot.date].findIndex((s: TimeSlot) => s.id === updatedSlot.id);
          if (index !== -1) {
            this.currentSchedule.schedule[updatedSlot.date][index] = updatedSlot;
          }
        }
        this.isLoading = false;
        
        // Обновляем слот в выбранном дне
        if (this.selectedDaySlots.length > 0) {
          const index = this.selectedDaySlots.findIndex(s => s.id === updatedSlot.id);
          if (index !== -1) {
            this.selectedDaySlots[index] = updatedSlot;
          }
        }
        
        // Пересоздаем календарь для отображения актуальных данных
        this.buildCalendar();
      },
      error: (error: any) => {
        this.isLoading = false;
        this.errorMessage = 'Ошибка при обновлении слота';
        console.error('Ошибка обновления слота:', error);
      }
    });
  }

  // Изменить расписание (обновить доступность слотов)
  editSchedule(): void {
    if (!this.currentSchedule) {
      this.errorMessage = 'Расписание не найдено';
      return;
    }
    
    if (!this.selectedCalendarDate) {
      this.errorMessage = 'Выберите дату для изменения расписания';
      return;
    }
    
    if (this.selectedDoctorId <= 0) {
      this.errorMessage = 'Для изменения расписания необходимо выбрать врача';
      return;
    }
    
    // Проверка периода выбранной даты
    const selectedDateStr = this.formatDate(this.selectedCalendarDate);
    const startDate = new Date(this.startDate);
    const endDate = new Date(this.endDate);
    const selectedDate = new Date(selectedDateStr);
    
    // Подтверждение действия
    if (confirm('Вы уверены, что хотите изменить расписание для выбранной даты?')) {
      this.isLoading = true;
      
      // Получаем все слоты для выбранной даты
      const slotsToUpdate = this.selectedDaySlots.map(slot => {
        return {
          id: slot.id,
          isAvailable: slot.isAvailable
        };
      });
      
      // Отправляем только изменения для выбранного дня
      this.scheduleService.updateDaySchedule(this.selectedDoctorId, selectedDateStr, slotsToUpdate)
        .subscribe(
          () => {
            // Обновляем только отображение календаря
            this.loadSchedule();
            this.errorMessage = '';
          },
          (error: any) => {
            this.errorMessage = 'Ошибка при обновлении расписания: ' + error.message;
            this.isLoading = false;
          }
        );
    }
  }

  // Изменение доктора
  onDoctorChange(doctorId: number): void {
    this.selectedDoctorId = doctorId;
    if (doctorId > 0) {
      this.isLoading = true;
      this.currentSchedule = null; // Очищаем текущее расписание

      // Загружаем настройки доктора
      this.loadDoctorSettings(doctorId);
    } else {
      // Очищаем форму если не выбран врач
      this.initForm();
      this.currentSchedule = null;
      this.buildEmptyCalendar();
    }
  }

  // Изменение больницы
  onHospitalChange(hospitalId: number): void {
    this.selectedHospitalId = hospitalId;
    this.selectedSpecialityId = 0;
    this.selectedDoctorId = 0;
    
    // Очищаем списки специальностей и врачей
    this.specialities = [];
    this.doctors = [];
    
    // Загружаем специальности для выбранной больницы
    this.loadSpecialities(hospitalId);
  }

  // Изменение специальности
  onSpecialityChange(specialityId: number): void {
    this.selectedSpecialityId = specialityId;
    this.selectedDoctorId = 0;
    
    // Очищаем список врачей
    this.doctors = [];
    
    // Загружаем врачей для выбранной больницы и специальности
    this.loadDoctorsBySpeciality(this.selectedHospitalId, specialityId);
  }

  // Фильтрация больниц
  filterHospitals(): void {
    if (!this.hospitalFilter.trim()) {
      this.hospitals = [...this.allHospitals];
      return;
    }
    
    const filterValue = this.hospitalFilter.toLowerCase().trim();
    this.hospitals = this.allHospitals.filter(
      hospital => hospital.name.toLowerCase().includes(filterValue)
    );
  }
  
  // Фильтрация специальностей
  filterSpecialities(): void {
    if (!this.specialityFilter.trim()) {
      this.specialities = [...this.allSpecialities];
      return;
    }
    
    const filterValue = this.specialityFilter.toLowerCase().trim();
    this.specialities = this.allSpecialities.filter(
      speciality => speciality.name.toLowerCase().includes(filterValue)
    );
  }
  
  // Фильтрация врачей
  filterDoctors(): void {
    if (!this.doctorFilter.trim()) {
      // Копируем все данные, но с преобразованием типа
      this.doctors = this.allDoctors.map(doctor => ({
        id: doctor.doctorId,
        name: doctor.fullName,
        specialization: doctor.doctorsSpeciality?.name || ''
      }));
      return;
    }
    
    const filterValue = this.doctorFilter.toLowerCase().trim();
    this.doctors = this.allDoctors
      .filter(doctor => doctor.fullName.toLowerCase().includes(filterValue))
      .map(doctor => ({
        id: doctor.doctorId,
        name: doctor.fullName,
        specialization: doctor.doctorsSpeciality?.name || ''
      }));
  }

  // Изменение периода
  onPeriodChange(): void {
    // Проверка лимитов дат
    const startDateObj = new Date(this.startDate);
    const endDateObj = new Date(this.endDate);
    const maxEndDateObj = new Date(this.maxEndDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Начальная дата не может быть раньше сегодня
    if (startDateObj < today) {
      this.startDate = this.formatDate(today);
      this.errorMessage = 'Начальная дата не может быть раньше сегодня';
      return;
    }
    
    // Конечная дата не может быть раньше начальной
    if (endDateObj < startDateObj) {
      this.endDate = this.startDate;
      this.errorMessage = 'Конечная дата не может быть раньше начальной';
      return;
    }
    
    // Конечная дата не может быть позже максимальной
    if (endDateObj > maxEndDateObj) {
      this.endDate = this.maxEndDate;
      this.errorMessage = 'Период не может быть больше 3 месяцев от текущей даты';
      return;
    }
    
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
    const workDays = this.settingsForm.get('workDays')?.value;
    if (!workDays) return false;
    return workDays.includes(dayId);
  }

  // Переключение выбора дня недели
  toggleDay(dayId: number): void {
    const currentWorkDays = [...(this.settingsForm.get('workDays')?.value || [])];
    const index = currentWorkDays.indexOf(dayId);
    
    if (index === -1) {
      currentWorkDays.push(dayId);
      console.log(`Добавлен день ${dayId} (${this.weekdays[dayId-1].name})`);
    } else {
      currentWorkDays.splice(index, 1);
      console.log(`Удален день ${dayId} (${this.weekdays[dayId-1].name})`);
    }
    
    // Обновляем значение в форме
    this.settingsForm.get('workDays')?.setValue(currentWorkDays);
    
    // Обновляем строковое представление дней недели для API
    const workDaysString = currentWorkDays.join(',');
    console.log('Текущие рабочие дни (строка):', workDaysString);
  }

  // --- Методы для работы с календарем ---

  // Построение пустого календаря для отображения до загрузки данных
  buildEmptyCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Получаем день недели для первого дня месяца (0 - воскресенье, 1 - понедельник)
    // Преобразуем к нашему формату (0 - понедельник, 6 - воскресенье)
    let firstDayOfWeek = firstDay.getDay();
    if (firstDayOfWeek === 0) firstDayOfWeek = 7; // Воскресенье переносим в конец
    firstDayOfWeek--; // Сдвигаем на -1, чтобы понедельник был 0
    
    const daysInMonth = lastDay.getDate();
    
    // Создаем массив дней
    const days = [];
    let week = [];
    
    // Добавляем пустые клетки для дней из предыдущего месяца
    for (let i = 0; i < firstDayOfWeek; i++) {
      week.push({
        date: null,
        month: null,
        year: null,
        isWeekend: false,
        isDisabled: true,
        isToday: false,
        availableSlots: 0
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Добавляем дни текущего месяца
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dateStr = this.formatDate(date);
      
      const dayData = {
        date: i,
        month: month,
        year: year,
        isWeekend: isWeekend,
        isDisabled: date < today,
        isToday: date.getTime() === today.getTime(),
        availableSlots: 0,
        totalSlots: 0,
        dateStr: dateStr
      };
      
      week.push(dayData);
      
      // Если достигли конца недели или конца месяца, добавляем неделю в массив
      if (week.length === 7 || i === daysInMonth) {
        if (week.length < 7) {
          // Добавляем пустые клетки в конце
          const remaining = 7 - week.length;
          for (let j = 0; j < remaining; j++) {
            week.push({
              date: null,
              month: null,
              year: null,
              isWeekend: false,
              isDisabled: true,
              isToday: false,
              availableSlots: 0,
              totalSlots: 0
            });
          }
        }
        
        days.push(week);
        week = [];
      }
    }
    
    this.calendarDays = days;
  }

  // Построение календаря
  buildCalendar(): void {
    // Сначала строим базовый календарь
    this.buildEmptyCalendar();
    
    // Если нет данных расписания, возвращаемся
    if (!this.currentSchedule || !this.currentSchedule.schedule) return;
    
    // Обновляем информацию о доступных слотах в готовом календаре
    for (let weekIndex = 0; weekIndex < this.calendarDays.length; weekIndex++) {
      for (let dayIndex = 0; dayIndex < this.calendarDays[weekIndex].length; dayIndex++) {
        const day = this.calendarDays[weekIndex][dayIndex];
        
        // Пропускаем пустые дни или дни из других месяцев
        if (!day.date) continue;
        
        // Проверяем, есть ли слоты для этого дня
        const date = new Date(day.year, day.month, day.date);
        const dateStr = this.formatDate(date);
        
        if (this.currentSchedule.schedule[dateStr]) {
          const slots = this.currentSchedule.schedule[dateStr];
          day.totalSlots = slots.length;
          day.availableSlots = slots.filter((slot: TimeSlot) => slot.isAvailable).length;
        } else {
          day.totalSlots = 0;
          day.availableSlots = 0;
        }
      }
    }
    
    // Если есть выбранная дата, обновляем слоты для нее
    if (this.selectedCalendarDate) {
      this.updateSelectedDaySlots();
    }
  }

  // Обновление слотов для выбранного дня
  updateSelectedDaySlots(): void {
    if (!this.selectedCalendarDate || !this.currentSchedule || !this.currentSchedule.schedule) {
      this.selectedDaySlots = [];
      return;
    }
    
    const dateStr = this.formatDate(this.selectedCalendarDate);
    
    if (this.currentSchedule.schedule[dateStr]) {
      // Создаем копию массива слотов
      this.selectedDaySlots = [...this.currentSchedule.schedule[dateStr]];
      // Сортируем слоты по времени
      this.selectedDaySlots.sort((a, b) => {
        // Преобразуем время в минуты для сравнения
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        
        const minutesA = timeA[0] * 60 + timeA[1];
        const minutesB = timeB[0] * 60 + timeB[1];
        
        return minutesA - minutesB;
      });
    } else {
      this.selectedDaySlots = [];
    }
  }

  // Переход к предыдущему месяцу
  prevMonth(): void {
    const prevMonth = new Date(this.currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    // Проверяем, не уходим ли в прошлое
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    
    if (prevMonth >= today) {
      this.currentMonth = prevMonth;
      this.buildCalendar();
    }
  }

  // Переход к следующему месяцу
  nextMonth(): void {
    const nextMonth = new Date(this.currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    // Проверяем, не уходим ли более чем на 3 месяца вперед
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    maxDate.setDate(1);
    
    if (nextMonth <= maxDate) {
      this.currentMonth = nextMonth;
      this.buildCalendar();
    }
  }

  // Проверка возможности перехода к предыдущему месяцу
  canGoToPrevMonth(): boolean {
    const prevMonth = new Date(this.currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    const today = new Date();
    today.setDate(1);
    today.setHours(0, 0, 0, 0);
    
    return prevMonth >= today;
  }

  // Проверка возможности перехода к следующему месяцу
  canGoToNextMonth(): boolean {
    const nextMonth = new Date(this.currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    maxDate.setDate(1);
    
    return nextMonth <= maxDate;
  }

  // Выбор даты в календаре
  selectCalendarDate(day: any): void {
    if (day.isDisabled || !day.date) return;
    
    this.selectedCalendarDate = new Date(day.year, day.month, day.date);
    this.updateSelectedDaySlots();
  }

  // Получение названия месяца
  getMonthName(date: Date): string {
    return this.months[date.getMonth()];
  }

  // Форматирование выбранной даты для отображения
  formatSelectedDate(date: Date): string {
    const day = date.getDate();
    const month = this.months[date.getMonth()];
    return `${day} ${month}`;
  }

  // Получение дня недели для даты в формате Date
  getDayOfWeekForDate(date: Date): string {
    const dayIndex = date.getDay();
    return this.weekdays[dayIndex].name;
  }

  // Удаление расписания
  deleteSchedule(): void {
    if (!this.currentSchedule) {
      this.errorMessage = 'Расписание не найдено для удаления';
      return;
    }
    
    if (this.selectedDoctorId <= 0) {
      this.errorMessage = 'Для удаления расписания необходимо выбрать врача';
      return;
    }
    
    // Запрашиваем подтверждение у пользователя
    if (confirm('Вы уверены, что хотите удалить расписание? Это действие нельзя отменить.')) {
      this.isLoading = true;
      
      // Здесь в будущем будет реальный запрос к API для удаления расписания
      // this.scheduleService.deleteSchedule(this.selectedDoctorId, this.startDate, this.endDate)
      //   .subscribe({
      //     ...
      //   });
      
      // Пока используем заглушку - просто очищаем локальное расписание после задержки
      setTimeout(() => {
        this.currentSchedule = null;
        this.selectedCalendarDate = null;
        this.selectedDaySlots = [];
        
        // Перестраиваем пустой календарь
        this.buildEmptyCalendar();
        
        this.isLoading = false;
        this.saveSuccess = true;
        
        // Скрываем сообщение об успехе через 3 секунды
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      }, 1000);
    }
  }
} 