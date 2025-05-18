import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ScheduleService } from '../../../core/services/schedule.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { DoctorScheduleView, ScheduleSettings, TimeSlot, AutoGenerationSettings } from '../../../shared/interfaces/schedule.interface';
import { Hospital as OrderHospital } from '../../../shared/interfaces/order.interface';
import { DoctorDetails } from '../../../shared/interfaces/order.interface';
import { take, switchMap } from 'rxjs/operators';
import { StatisticsService } from '../../../core/services/statistics.service';
import { ScheduleStatistics, StatisticsPeriod, StatisticsScope, AppointmentStatusFilter, ScheduleOptimization, OptimizationType } from '../../../shared/interfaces/statistics.interface';

@Component({
  selector: 'app-schedule-management',
  templateUrl: './schedule-management.component.html',
  styleUrls: ['./schedule-management.component.scss']
})
export class ScheduleManagementComponent implements OnInit {
  // Make Math available to templates
  Math = Math;

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
  
  // Настройки автоматической генерации
  autoGenerateScope: string = 'selectedDoctor'; // allHospitals, selectedHospital, selectedSpeciality, selectedDoctor
  autoGeneratePeriod: string = 'month'; // week, month, year
  autoGenerateStartDate: string = '';
  autoGenerateEndDate: string = '';
  autoGenerateResult: string = '';
  autoGenerateSuccess: boolean = false;
  generatedDoctorNames: string[] = []; // Список врачей, для которых создано расписание
  
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

  // Переменные для раскрывающегося блока автогенерации
  isAutoGenerationPanelOpen: boolean = false;
  autoGenerationActive: boolean = false;
  autoGenerationInfo: any = null;

  // Переменные для работы со статистикой
  isStatisticsPanelOpen: boolean = false;
  statisticsScope: string = StatisticsScope.SelectedDoctor;
  statisticsPeriod: string = StatisticsPeriod.Month;
  statistics: ScheduleStatistics | null = null;
  isLoadingStatistics: boolean = false;
  
  // Переменные для настройки отображения временного периода в статистике
  statisticsTimePeriod: string = 'default'; // 'default', '24hour', 'custom'
  statisticsStartHour: number = 8; // По умолчанию с 8 утра
  statisticsEndHour: number = 18; // По умолчанию до 18 вечера
  customStartHour: number = 8;
  customEndHour: number = 18;
  hourOptions = Array.from({length: 24}, (_, i) => i); // Массив часов [0,1,2,...,23]
  
  /**
   * Текущий диапазон дат статистики в формате дд.мм.гггг-дд.мм.гггг
   */
  statisticsDateRange: string = '';

  /**
   * Текущий фильтр статусов для графика
   */
  selectedStatusFilter: AppointmentStatusFilter = AppointmentStatusFilter.All;

  /**
   * Флаг начинать период с сегодняшнего дня
   */
  startFromToday: boolean = false;

  // Сделаем enum доступным в шаблоне
  AppointmentStatusFilter = AppointmentStatusFilter;

  /**
   * Флаг для отображения детальной таблицы по часам
   */
  showHourlyTable: boolean = false;

  /**
   * Флаг для отображения детальной таблицы по дням недели
   */
  showWeekdayTable: boolean = false;

  /**
   * Рекомендации по оптимизации расписания
   */
  scheduleOptimization: ScheduleOptimization | null = null;

  /**
   * Флаг загрузки рекомендаций
   */
  isLoadingOptimization: boolean = false;

  /**
   * Флаг для отображения панели рекомендаций
   */
  showOptimizationPanel: boolean = false;

  /**
   * Флаг для отображения уведомления об оптимизации
   */
  showOptimizationNotification: boolean = false;

  /**
   * Таймер для проверки необходимости оптимизации
   */
  optimizationCheckInterval: any;

  /**
   * Оптимизация применена
   */
  optimizationApplied: boolean = false;

  /**
   * Перечисление типов оптимизации для использования в шаблоне
   */
  OptimizationType = OptimizationType;

  // Информация о трендах оптимизации
  optimizationTrendInfo: any = null;

  constructor(
    private fb: FormBuilder,
    private scheduleService: ScheduleService,
    private authService: AuthService,
    private orderService: OrderService,
    private statisticsService: StatisticsService
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
    
    // Установка максимального периода (сегодня + 3 месяца)
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    this.maxEndDate = this.formatDate(maxDate);
    
    // Устанавливаем конечную дату по умолчанию на максимальную
    this.endDate = this.maxEndDate;
    
    // Получение роли пользователя
    this.getUserRole();
    
    // Загружаем сохраненные настройки временного периода из localStorage
    this.loadStatisticsTimeSettings();
  }

  ngOnInit(): void {
    console.log('Инициализация компонента ScheduleManagement');
    
    // Инициализируем dates
    const today = new Date();
    this.startDate = this.formatDate(today);
    
    // Устанавливаем конечную дату на 30 дней вперед
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30);
    this.endDate = this.formatDate(endDate);
    
    // Устанавливаем максимальную конечную дату на 3 месяца вперед
    const maxEndDate = new Date();
    maxEndDate.setMonth(today.getMonth() + 3);
    this.maxEndDate = this.formatDate(maxEndDate);
    
    // Инициализируем форму настроек
    this.initForm();
    
    // Получаем роль пользователя
    this.getUserRole();
    
    // Пытаемся восстановить выбранные значения после инициализации
    setTimeout(() => {
      this.restoreSelectedValuesFromLocalStorage();
    }, 1000);

    // Запускаем проверку необходимости оптимизации
    this.startOptimizationCheck();
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
    console.log('Получение роли пользователя');
    
    const userInfo = this.authService.getUserInfo();
    if (!userInfo) {
      console.error('Не удалось получить информацию о пользователе');
      this.errorMessage = 'Ошибка идентификации пользователя';
      return;
    }
    
    this.userRole = userInfo.role || '';
    console.log('Роль пользователя:', this.userRole);
    
    // После получения роли пользователя, вызываем инициализацию
    this.initializeByRole();
  }
  
  // Инициализация компонента в зависимости от роли пользователя
  private initializeByRole(): void {
    console.log('Инициализация компонента по роли пользователя:', this.userRole);
    
    // Сбрасываем выбранные значения
    this.selectedHospitalId = 0;
    this.selectedSpecialityId = 0;
    this.selectedDoctorId = 0;
    
    switch (this.userRole) {
      case 'Administrator':
        console.log('Инициализация для администратора');
        // Загружаем список больниц
        this.loadHospitals();
        break;
        
      case 'ChiefDoctor':
        console.log('Инициализация для главврача');
        // Для главврача загружаем сначала его информацию из API, чтобы узнать его больницу
        this.isLoading = true;
        
        // Получаем информацию о пользователе из AuthService
        const userInfo = this.authService.getUserInfo();
        if (!userInfo || !userInfo.userId) {
          console.error('Не удалось получить ID пользователя');
          this.errorMessage = 'Ошибка идентификации пользователя';
          this.isLoading = false;
          return;
        }
        const userId = userInfo.userId.toString();
        
        this.scheduleService.getChiefDoctorInfo(userId).subscribe({
          next: (info) => {
            console.log('Информация о главвраче:', info);
            
            if (info && info.doctorId && info.hospitalId) {
              // Сохраняем ID главврача как доктора для работы с его расписанием
              this.selectedDoctorId = info.doctorId;
              this.selectedHospitalId = info.hospitalId;
              
              // Загружаем специальности для данной больницы
              this.loadSpecialities(this.selectedHospitalId);
              
              // Загружаем настройки расписания для этого врача
              this.loadDoctorSettings(this.selectedDoctorId);
            } else {
              this.errorMessage = 'Ошибка получения информации о главвраче';
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error('Ошибка при получении информации о главвраче:', error);
            this.errorMessage = 'Ошибка при получении информации о главвраче';
            this.isLoading = false;
          }
        });
        break;
        
      case 'Doctor':
        console.log('Инициализация для врача');
        // Для врача загружаем сначала его информацию из API
        this.isLoading = true;
        
        // Получаем информацию о пользователе из AuthService
        const doctorUserInfo = this.authService.getUserInfo();
        if (!doctorUserInfo || !doctorUserInfo.userId) {
          console.error('Не удалось получить ID пользователя');
          this.errorMessage = 'Ошибка идентификации пользователя';
          this.isLoading = false;
          return;
        }
        const doctorUserId = doctorUserInfo.userId.toString();
        
        this.scheduleService.getDoctorInfoByUserId(doctorUserId).subscribe({
          next: (info) => {
            console.log('Информация о враче:', info);
            
            if (info && info.doctorId && info.hospitalId) {
              // Сохраняем ID врача для работы с его расписанием
              this.selectedDoctorId = info.doctorId;
              console.log('Установлен ID врача:', this.selectedDoctorId);
              
              // Сохраняем ID больницы
              this.selectedHospitalId = info.hospitalId;
              console.log('Установлен ID больницы:', this.selectedHospitalId);
              
              // Загружаем настройки расписания для этого врача
              this.loadDoctorSettings(this.selectedDoctorId);
            } else {
              this.errorMessage = 'Ошибка получения информации о враче';
              this.isLoading = false;
            }
          },
          error: (error) => {
            console.error('Ошибка при получении информации о враче:', error);
            this.errorMessage = 'Ошибка при получении информации о враче';
            this.isLoading = false;
          }
        });
        break;
        
      default:
        console.warn('Неизвестная роль пользователя:', this.userRole);
        this.errorMessage = 'У вас нет доступа к этому разделу';
        break;
    }
    
    // Строим пустой календарь
    this.buildEmptyCalendar();
  }
  
  // Загрузка списка больниц
  loadHospitals(): void {
    this.isLoading = true;
    this.orderService.getHospitals().subscribe({
      next: (data) => {
        this.allHospitals = data;
        this.hospitals = [...data];
        
        // Если у нас роль ChiefDoctor и мы уже получили ID больницы
        if (this.userRole === 'ChiefDoctor' && this.selectedHospitalId > 0) {
          // Выбираем соответствующую больницу в списке
          const selectedHospital = this.hospitals.find(h => h.hospitalId === this.selectedHospitalId);
          if (selectedHospital) {
            console.log(`Найдена больница: ${selectedHospital.name} (ID: ${selectedHospital.hospitalId})`);
          } else {
            console.warn(`Больница с ID=${this.selectedHospitalId} не найдена в списке`);
          }
        }
        
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
  
  // Загрузка врачей по больнице и специальности
  loadDoctorsBySpeciality(hospitalId: number, specialityId: number): void {
    console.log('Загружаем врачей для больницы', hospitalId, 'и специальности', specialityId);
    
    // Сохраняем текущий ID врача
    const currentDoctorId = this.selectedDoctorId;
    
    this.isLoading = true;
    this.orderService.getDoctorsBySpecialityAndHospital(hospitalId, specialityId).subscribe({
      next: (response: any[]) => {
        console.log('Получены данные о врачах:', response);
        
        // Если в ответе пустой массив, устанавливаем пустой список врачей
        if (!response || response.length === 0) {
          this.doctors = [];
          this.isLoading = false;
          return;
        }
        
        // Преобразуем полученные данные в удобный формат
        this.doctors = response.map((doctor: any) => {
          console.log('Преобразованный врач:', {
            id: doctor.doctorId,
            name: doctor.fullName,
            specialization: doctor.specialityName
          });
          
          return {
            id: doctor.doctorId,
            name: doctor.fullName,
            specialization: doctor.specialityName
          };
        });
        
        console.log('Преобразованный список врачей:', this.doctors);
        
        // Проверяем, есть ли текущий врач в новом списке
        if (currentDoctorId > 0) {
          const doctorExists = this.doctors.some(doc => doc.id === currentDoctorId);
          if (doctorExists) {
            // Если врач найден в списке, сохраняем его ID
            console.log('Текущий врач ID:', currentDoctorId, 'найден в списке врачей, сохраняем его');
            this.selectedDoctorId = currentDoctorId;
            this.settingsForm.get('doctorId')?.setValue(currentDoctorId);
            // Загружаем настройки и расписание для найденного врача
            this.loadDoctorSettings(currentDoctorId);
          } else {
            // Если врач не найден, сбрасываем выбор
            console.log('Текущий врач ID:', currentDoctorId, 'не найден в новом списке, сбрасываем выбор');
            this.selectedDoctorId = 0;
            this.settingsForm.get('doctorId')?.setValue(0);
            this.currentSchedule = null;
            this.buildEmptyCalendar();
          }
        }
        
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Ошибка при загрузке врачей:', error);
        this.doctors = [];
        this.isLoading = false;
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
    if (!doctorId) {
      this.resetForm();
      return;
    }
    
    console.log('Начинаем загрузку настроек для врача с ID:', doctorId);
    this.isLoading = true;
    
    // Убедимся, что ID врача сохранен в компоненте
    this.selectedDoctorId = doctorId;
    const previousHospitalId = this.selectedHospitalId; // Сохраняем текущий hospitalId
    
    this.scheduleService.getDoctorScheduleSettings(doctorId).subscribe({
      next: (settings) => {
        console.log('Загружены настройки:', settings);
        this.lastSettings = settings;
        
        // Заполняем форму настройками
        this.settingsForm.patchValue({
          workdayStart: settings.workdayStart || '08:00',
          workdayEnd: settings.workdayEnd || '17:00',
          slotDuration: settings.slotDuration || 30,
          breakDuration: settings.breakDuration || 5,
          lunchStart: settings.lunchStart || '12:00',
          lunchEnd: settings.lunchEnd || '13:00',
          workDays: this.parseWorkDays(settings.workDays || '1,2,3,4,5'),
          doctorId: this.selectedDoctorId
        });
        
        // Не изменяем выбранную больницу, если она уже выбрана
        if (!previousHospitalId && settings.hospitalId) {
          this.selectedHospitalId = settings.hospitalId;
        }
        
        // Загружаем настройки автоматической генерации
        this.loadAutoGenerationSettings();
        
        // Проверяем, что ID врача все еще установлен
        console.log('Перед загрузкой расписания, ID врача =', this.selectedDoctorId);
        
        // Сохраняем выбранные значения, чтобы они не потерялись
        this.saveSelectedValuesToLocalStorage();
        
        // Загружаем расписание с явной передачей ID врача
        this.loadSchedule();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Ошибка загрузки настроек:', error);
        
        // В случае 404 ошибки, используем дефолтные настройки, так как у врача ещё нет настроек
        if (error.status === 404) {
          console.log('Настройки не найдены для врача, используем дефолтные настройки');
          const defaultSettings = this.getDefaultSettings();
          this.lastSettings = defaultSettings;
          
          // Заполняем форму дефолтными настройками
          this.settingsForm.patchValue({
            workdayStart: defaultSettings.workdayStart,
            workdayEnd: defaultSettings.workdayEnd,
            slotDuration: defaultSettings.slotDuration,
            breakDuration: defaultSettings.breakDuration,
            lunchStart: defaultSettings.lunchStart,
            lunchEnd: defaultSettings.lunchEnd,
            workDays: this.parseWorkDays(defaultSettings.workDays),
            doctorId: this.selectedDoctorId // Сохраняем исходный ID врача
          });
        } else {
          // Даже в случае другой ошибки сбрасываем форму к дефолтным значениям
          this.lastSettings = null;
          this.resetForm();
          
          // Сбрасываем настройки автогенерации
          this.resetAutoGenerationSettings();
        }
        
        // Проверяем, что ID врача все еще установлен
        console.log('После ошибки загрузки настроек, ID врача =', this.selectedDoctorId);
        
        // Сохраняем выбранные значения, чтобы они не потерялись
        this.saveSelectedValuesToLocalStorage();
        
        // Всё равно пытаемся загрузить расписание (если оно есть)
        this.loadSchedule();
        
        this.isLoading = false;
      }
    });
  }

  // Загрузка расписания
  loadSchedule(): void {
    console.log('loadSchedule начинает выполнение. ID врача:', this.selectedDoctorId);
    
    if (!this.selectedDoctorId || this.selectedDoctorId <= 0) {
      console.log('loadSchedule: ID врача не выбран или некорректный, очищаем расписание и строим пустой календарь');
      // Очищаем текущее расписание и строим пустой календарь
      this.currentSchedule = null;
      this.buildEmptyCalendar();
      return;
    }
    
    this.isLoading = true;
    
    // Убедимся, что есть корректные даты для начала и конца периода
    if (!this.startDate || !this.endDate) {
      this.setDefaultDates();
    }
    
    console.log('Загрузка расписания для врача', this.selectedDoctorId, 'с', this.startDate, 'по', this.endDate);
    
    this.scheduleService.getDoctorSchedule(this.selectedDoctorId, this.startDate, this.endDate).subscribe({
      next: (schedule) => {
        console.log('Получено расписание:', schedule);
        this.currentSchedule = schedule;
        this.buildCalendar();
        
        // Если в расписании есть слоты, но не выбрана дата, выбираем первую дату с доступными слотами
        if (schedule && schedule.schedule && Object.keys(schedule.schedule).length > 0 && !this.selectedCalendarDate) {
          const firstDate = Object.keys(schedule.schedule)[0];
          this.selectedCalendarDate = new Date(firstDate);
          this.updateSelectedDaySlots();
        }
        
        this.isLoading = false;
        this.errorMessage = '';
      },
      error: (error) => {
        console.error('Ошибка загрузки расписания:', error);
        this.errorMessage = 'Не удалось загрузить расписание';
        this.currentSchedule = null;
        this.buildEmptyCalendar();
        this.isLoading = false;
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
        
        // Сохраняем выбранные значения в localStorage
        this.saveSelectedValuesToLocalStorage();
        
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
    
    // Сохраняем выбранные значения, чтобы они не потерялись при перезагрузке страницы
    this.saveSelectedValuesToLocalStorage();
    
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

  // Сохранение выбранных значений в localStorage
  private saveSelectedValuesToLocalStorage(): void {
    const selectedValues = {
      hospitalId: this.selectedHospitalId,
      specialityId: this.selectedSpecialityId,
      doctorId: this.selectedDoctorId,
      startDate: this.startDate,
      endDate: this.endDate
    };
    
    localStorage.setItem('scheduleManagement_selectedValues', JSON.stringify(selectedValues));
    console.log('Сохранены выбранные значения в localStorage:', selectedValues);
  }

  // Восстановление выбранных значений из localStorage
  private restoreSelectedValuesFromLocalStorage(): void {
    const savedValues = localStorage.getItem('scheduleManagement_selectedValues');
    if (savedValues) {
      try {
        const values = JSON.parse(savedValues);
        console.log('Восстановлены значения из localStorage:', values);
        
        // Восстанавливаем ID больницы и загружаем специальности
        if (values.hospitalId) {
          this.selectedHospitalId = values.hospitalId;
          this.loadSpecialities(values.hospitalId);
          
          // Восстанавливаем ID специальности и загружаем врачей, если есть
          if (values.specialityId) {
            this.selectedSpecialityId = values.specialityId;
            this.loadDoctorsBySpeciality(values.hospitalId, values.specialityId);
            
            // Восстанавливаем ID врача и загружаем его настройки, если есть
            if (values.doctorId) {
              this.selectedDoctorId = values.doctorId;
              this.settingsForm.get('doctorId')?.setValue(this.selectedDoctorId);
              this.loadDoctorSettings(values.doctorId);
            }
          }
        }
        
        // Восстанавливаем даты
        if (values.startDate) this.startDate = values.startDate;
        if (values.endDate) this.endDate = values.endDate;
        
      } catch (error) {
        console.error('Ошибка при восстановлении значений из localStorage:', error);
      }
    }
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
    console.log('Выбран врач с ID:', doctorId);
    
    // Проверяем, действительно ли это число
    if (typeof doctorId === 'string') {
      doctorId = parseInt(doctorId, 10);
      console.log('Преобразован doctorId в число:', doctorId);
    }
    
    // Устанавливаем ID врача явно
    this.selectedDoctorId = doctorId || 0;
    console.log('Установлен selectedDoctorId:', this.selectedDoctorId);
    
    // Обновляем значение DoctorId в форме
    this.settingsForm.get('doctorId')?.setValue(this.selectedDoctorId);
    
    // Сбрасываем текущее расписание
    this.currentSchedule = null;
    
    if (doctorId > 0) {
      console.log('Загружаем настройки для врача с ID:', doctorId);
      // Загружаем настройки для выбранного врача
      this.loadDoctorSettings(doctorId);
      
      // Загружаем настройки автоматической генерации для врача
      this.loadAutoGenerationSettings();
      
      // Сохраняем выбранные значения
      this.saveSelectedValuesToLocalStorage();
    } else {
      console.log('Не выбран врач, сбрасываем форму');
      this.resetForm();
      // Строим пустой календарь
      this.buildEmptyCalendar();
    }
  }

  // Обработка изменения больницы
  onHospitalChange(hospitalId: number): void {
    console.log('Выбрана больница с ID:', hospitalId);
    this.selectedHospitalId = hospitalId;
    
    // Сбрасываем зависимые поля
    this.specialities = [];
    this.selectedSpecialityId = 0;
    // Не сбрасываем врача, если он уже выбран, только если больница сменилась
    
    // Только загружаем специальности для выбранной больницы
    if (hospitalId) {
      this.loadSpecialities(hospitalId);
    }
    
    // Сохраняем текущие значения, но не сбрасываем ID врача
    const doctorId = this.selectedDoctorId;
    this.saveSelectedValuesToLocalStorage();
    this.selectedDoctorId = doctorId;
    console.log('После onHospitalChange, doctorId =', this.selectedDoctorId);
  }

  // Обработка изменения специальности
  onSpecialityChange(specialityId: number): void {
    console.log('Выбрана специальность с ID:', specialityId);
    
    // Сохраняем текущее значение doctorId
    const currentDoctorId = this.selectedDoctorId;
    
    this.selectedSpecialityId = specialityId;
    
    // Сбрасываем список врачей при изменении специальности
    this.doctors = [];
    
    // Если выбрана специальность, загружаем врачей
    if (specialityId > 0 && this.selectedHospitalId > 0) {
      console.log('Загружаем врачей для больницы', this.selectedHospitalId, 'и специальности', specialityId);
      this.loadDoctorsBySpeciality(this.selectedHospitalId, specialityId);
    }
    
    // Сохраняем выбранные значения
    this.saveSelectedValuesToLocalStorage();
    
    // Если был выбран врач, проверяем, доступен ли он всё ещё
    if (currentDoctorId > 0) {
      // Восстанавливаем ID врача, если он всё ещё доступен в новой специальности
      // Это будет проверено после загрузки списка врачей в методе loadDoctorsBySpeciality
      console.log('Пытаемся восстановить предыдущее значение doctorId =', currentDoctorId);
    }
  }

  // Фильтрация больниц
  filterHospitals(): void {
    if (!this.hospitalFilter || this.hospitalFilter.trim() === '') {
      this.hospitals = [...this.allHospitals];
      return;
    }
    
    const filterValue = this.hospitalFilter.toLowerCase().trim();
    this.hospitals = this.allHospitals.filter(
      hospital => hospital && hospital.name && hospital.name.toLowerCase().includes(filterValue)
    );
  }
  
  // Фильтрация специальностей
  filterSpecialities(): void {
    if (!this.specialityFilter || this.specialityFilter.trim() === '') {
      this.specialities = [...this.allSpecialities];
      return;
    }
    
    const filterValue = this.specialityFilter.toLowerCase().trim();
    this.specialities = this.allSpecialities.filter(
      speciality => speciality && speciality.name && speciality.name.toLowerCase().includes(filterValue)
    );
  }
  
  // Фильтрация врачей
  filterDoctors(): void {
    console.log('Фильтрация врачей, текущий фильтр:', this.doctorFilter);
    console.log('Все врачи перед фильтрацией:', this.allDoctors);
    
    if (!this.doctorFilter || this.doctorFilter.trim() === '') {
      // Копируем все данные с правильным преобразованием типа
      this.doctors = this.allDoctors.map(doctor => {
        const mappedDoctor = {
          id: doctor.doctorId,
          name: doctor.fullName,
          specialization: doctor.doctorsSpeciality?.name || ''
        };
        console.log('Преобразованный врач:', mappedDoctor);
        return mappedDoctor;
      });
      console.log('Врачи после преобразования:', this.doctors);
      return;
    }
    
    const filterValue = this.doctorFilter.toLowerCase().trim();
    this.doctors = this.allDoctors
      .filter(doctor => doctor && doctor.fullName && doctor.fullName.toLowerCase().includes(filterValue))
      .map(doctor => {
        const mappedDoctor = {
          id: doctor.doctorId,
          name: doctor.fullName,
          specialization: doctor.doctorsSpeciality?.name || ''
        };
        console.log('Отфильтрованный врач:', mappedDoctor);
        return mappedDoctor;
      });
    console.log('Отфильтрованные врачи:', this.doctors);
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
    
    // Обновляем текущий месяц для календаря на основе стартовой даты периода
    this.currentMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
    
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
    // Создаем дату для предыдущего месяца
    let prevMonth;
    if (this.currentMonth.getMonth() === 0) {
      // Если текущий месяц январь, то предыдущий - декабрь прошлого года
      prevMonth = new Date(this.currentMonth.getFullYear() - 1, 11, 1);
    } else {
      prevMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    }
    
    // Проверяем, не уходим ли в прошлое
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (prevMonth >= currentMonthStart) {
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
    
    // Убираем ограничение на первый день месяца
    // maxDate.setDate(1);
    
    if (nextMonth <= maxDate) {
      this.currentMonth = nextMonth;
      this.buildCalendar();
    }
  }

  // Проверка возможности перехода к предыдущему месяцу
  canGoToPrevMonth(): boolean {
    // Определяем первый день предыдущего месяца
    let prevMonth;
    if (this.currentMonth.getMonth() === 0) {
      // Если текущий месяц январь, то предыдущий - декабрь прошлого года
      prevMonth = new Date(this.currentMonth.getFullYear() - 1, 11, 1);
    } else {
      prevMonth = new Date(this.currentMonth.getFullYear(), this.currentMonth.getMonth() - 1, 1);
    }
    
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    return prevMonth >= currentMonthStart;
  }

  // Проверка возможности перехода к следующему месяцу
  canGoToNextMonth(): boolean {
    const nextMonth = new Date(this.currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    
    // Убираем ограничение на первый день месяца
    // maxDate.setDate(1);
    
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

  // Обновление расписания после удаления
  refreshSchedule(): void {
    // Очистка текущих данных
    this.currentSchedule = null;
    this.selectedCalendarDate = null;
    this.selectedDaySlots = [];
    
    // Если доктор не выбран, просто показываем пустой календарь
    if (this.selectedDoctorId <= 0) {
      this.buildEmptyCalendar();
      return;
    }
    
    console.log('Обновление расписания после удаления для врача:', this.selectedDoctorId);
    console.log('Период:', this.startDate, 'по', this.endDate);
    
    // Запрашиваем актуальное расписание
    this.isLoading = true;
    this.scheduleService.getDoctorSchedule(
      this.selectedDoctorId, 
      this.startDate, 
      this.endDate
    ).subscribe({
      next: (schedule) => {
        this.currentSchedule = schedule;
        
        // Устанавливаем текущий месяц на первый день из расписания, если он есть
        if (schedule && schedule.schedule && Object.keys(schedule.schedule).length > 0) {
          const scheduleDates = Object.keys(schedule.schedule).sort();
          if (scheduleDates.length > 0) {
            const firstScheduleDate = new Date(scheduleDates[0]);
            this.currentMonth = new Date(firstScheduleDate.getFullYear(), firstScheduleDate.getMonth(), 1);
          }
        } else {
          // Если в расписании нет дат, но начальная дата периода указана, используем ее месяц
          const startDateObj = new Date(this.startDate);
          if (startDateObj && !isNaN(startDateObj.getTime())) {
            this.currentMonth = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
          }
        }
        
        // Обновляем календарь с учетом текущего месяца
        this.buildCalendar();
        this.isLoading = false;
        
        console.log('Расписание после удаления:', schedule);
      },
      error: (error) => {
        console.error('Ошибка при обновлении расписания:', error);
        // Сохраняем текущий месяц и строим пустой календарь
        this.buildEmptyCalendar();
        this.isLoading = false;
      }
    });
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
    
    // Отладочная информация по датам
    console.log('Удаление расписания для периода:');
    console.log('Начальная дата:', this.startDate);
    console.log('Конечная дата:', this.endDate);
    
    const startDateObj = new Date(this.startDate);
    const endDateObj = new Date(this.endDate);
    
    console.log('Начальная дата (объект):', startDateObj);
    console.log('Конечная дата (объект):', endDateObj);
    console.log('Месяц начальной даты (0-11):', startDateObj.getMonth());
    console.log('Месяц конечной даты (0-11):', endDateObj.getMonth());
    
    // Запрашиваем подтверждение у пользователя
    if (confirm('Вы уверены, что хотите удалить расписание? Это действие нельзя отменить.')) {
      this.isLoading = true;
      
      // Вызываем реальный API для удаления расписания
      this.scheduleService.deleteSchedule(this.selectedDoctorId, this.startDate, this.endDate)
        .subscribe({
          next: (success) => {
            if (success) {
              // Сбрасываем период к стандартным значениям (с сегодняшней даты на 3 месяца вперед)
              const today = new Date();
              this.startDate = this.formatDate(today);
              
              const maxDate = new Date();
              maxDate.setMonth(maxDate.getMonth() + 3);
              this.endDate = this.formatDate(maxDate);
              
              // Обновляем текущий месяц для календаря
              this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              
              // Загружаем актуальное расписание с новым периодом
              this.refreshSchedule();
              this.saveSuccess = true;
              
              // Скрываем сообщение об успехе через 3 секунды
              setTimeout(() => {
                this.saveSuccess = false;
              }, 3000);
            } else {
              this.errorMessage = 'Не удалось удалить расписание';
              this.isLoading = false;
            }
          },
          error: (error) => {
            this.errorMessage = 'Ошибка при удалении расписания: ' + (error.error || error.message);
            this.isLoading = false;
            console.error('Ошибка удаления расписания:', error);
          }
        });
    }
  }

  // Вспомогательные методы для шаблона
  findHospitalName(hospitalId: number): string {
    return this.hospitals.find(h => h.hospitalId === hospitalId)?.name || '';
  }

  findDoctorName(doctorId: number): string {
    return this.doctors.find(d => d.id === doctorId)?.name || '';
  }

  hasHospital(hospitalId: number): boolean {
    return this.hospitals && this.hospitals.length > 0 && 
           this.hospitals.some(h => h.hospitalId === hospitalId);
  }

  hasDoctor(doctorId: number): boolean {
    return this.doctors && this.doctors.length > 0 && 
           this.doctors.some(d => d.id === doctorId);
  }

  // Перезапись расписания (удаление и создание нового с обновленными настройками)
  updateSchedule(): void {
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
      this.errorMessage = 'Пожалуйста, выберите врача перед изменением расписания';
      return;
    }
    
    if (this.selectedHospitalId <= 0) {
      this.errorMessage = 'Пожалуйста, выберите больницу перед изменением расписания';
      return;
    }
    
    // Сохраняем текущий период для использования после удаления
    const periodStartDate = this.startDate;
    const periodEndDate = this.endDate;
    
    // Запрашиваем подтверждение у пользователя
    if (confirm('Вы уверены, что хотите изменить расписание на выбранный период? Существующее расписание будет удалено и создано новое с обновленными настройками.')) {
      this.isLoading = true;
      this.errorMessage = '';
      
      // Шаг 1: Удаляем расписание на выбранный период
      this.scheduleService.deleteSchedule(this.selectedDoctorId, periodStartDate, periodEndDate)
        .subscribe({
          next: (deleteSuccess) => {
            if (deleteSuccess) {
              console.log('Расписание успешно удалено, создаем новое с обновленными настройками');
              
              // Шаг 2: Получаем настройки из формы
              const formValues = this.settingsForm.value;
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
              
              // Сохраняем обновленные настройки
              this.scheduleService.saveDoctorScheduleSettings(settings).subscribe({
                next: () => {
                  console.log('Настройки расписания обновлены');
                  
                  // Шаг 3: Создаем новое расписание с обновленными настройками
                  // Выбираем метод генерации в зависимости от флага автоматической генерации
                  const generateMethod = this.autoGenerateEnabled 
                    ? this.scheduleService.generateAutomaticSchedule.bind(this.scheduleService)
                    : this.scheduleService.generateSchedule.bind(this.scheduleService);
                  
                  generateMethod(
                    this.selectedDoctorId,
                    periodStartDate,
                    periodEndDate,
                    settings
                  ).subscribe({
                    next: (schedule) => {
                      this.currentSchedule = schedule;
                      
                      // Сбрасываем период к стандартным значениям (с сегодняшней даты на 3 месяца вперед)
                      const today = new Date();
                      this.startDate = this.formatDate(today);
                      
                      const maxDate = new Date();
                      maxDate.setMonth(maxDate.getMonth() + 3);
                      this.endDate = this.formatDate(maxDate);
                      
                      // Устанавливаем текущий месяц для календаря
                      this.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                      
                      // Загружаем актуальное расписание с новым периодом
                      this.loadSchedule();
                      
                      this.saveSuccess = true;
                      
                      // Скрываем сообщение об успехе через 3 секунды
                      setTimeout(() => {
                        this.saveSuccess = false;
                      }, 3000);
                    },
                    error: (error) => {
                      this.isLoading = false;
                      this.errorMessage = "Ошибка создания нового расписания: " + (error.error || error.message || JSON.stringify(error));
                      console.error('Ошибка создания нового расписания:', error);
                    }
                  });
                },
                error: (error) => {
                  this.isLoading = false;
                  this.errorMessage = "Ошибка сохранения настроек: " + (error.error || error.message || JSON.stringify(error));
                  console.error('Ошибка сохранения настроек:', error);
                }
              });
            } else {
              this.errorMessage = 'Не удалось удалить существующее расписание';
              this.isLoading = false;
            }
          },
          error: (error) => {
            this.errorMessage = 'Ошибка при удалении расписания: ' + (error.error || error.message);
            this.isLoading = false;
            console.error('Ошибка удаления расписания:', error);
          }
        });
    }
  }

  private buildDeleteData() {
    // Implementation of buildDeleteData method
  }

  private buildCreateData() {
    // Implementation of buildCreateData method
  }

  // Проверка возможности запуска автоматической генерации
  canStartAutoGeneration(): boolean {
    // Проверка наличия стартовой даты
    if (!this.autoGenerateStartDate) {
      return false;
    }

    // Проверка корректности выбранной области генерации
    switch (this.autoGenerateScope) {
      case 'allHospitals':
        // Для всех больниц не требуются дополнительные проверки
        return true;
      case 'selectedHospital':
        // Должна быть выбрана больница
        return !!this.selectedHospitalId;
      case 'selectedSpeciality':
        // Должны быть выбраны больница и специальность
        return !!this.selectedHospitalId && !!this.selectedSpecialityId;
      case 'selectedDoctor':
        // Должен быть выбран врач
        return !!this.selectedDoctorId;
      default:
        return false;
    }
  }

  // Расчет даты окончания на основе выбранного периода
  calculateEndDate(): void {
    if (!this.autoGenerateStartDate) {
      this.autoGenerateEndDate = '';
      return;
    }

    const startDate = new Date(this.autoGenerateStartDate);
    let endDate = new Date(startDate);

    switch (this.autoGeneratePeriod) {
      case 'week':
        // Добавляем 7 дней к начальной дате
        endDate.setDate(startDate.getDate() + 6); // 7 дней - 1 день = 6 (включая начальный день)
        break;
      case 'month':
        // Добавляем 1 месяц к начальной дате
        endDate.setMonth(startDate.getMonth() + 1);
        endDate.setDate(endDate.getDate() - 1); // Последний день месяца
        break;
      case 'year':
        // Добавляем 1 год к начальной дате
        endDate.setFullYear(startDate.getFullYear() + 1);
        endDate.setDate(endDate.getDate() - 1); // Последний день года
        break;
    }

    this.autoGenerateEndDate = this.formatDate(endDate);
  }

  // Начать автоматическую генерацию
  startAutoGenerate(): void {
    if (!this.canStartAutoGeneration()) {
      this.autoGenerateResult = 'Невозможно выполнить автоматическую генерацию. Проверьте параметры.';
      this.autoGenerateSuccess = false;
      this.generatedDoctorNames = []; // Очищаем список врачей
      return;
    }

    // Запрашиваем подтверждение перед созданием новой автогенерации
    if (!confirm('Вы уверены, что хотите создать новое расписание? Это действие заменит существующее расписание на выбранный период.')) {
      return;
    }

    // Отображаем информацию о генерации
    this.isLoading = true;
    this.autoGenerateResult = 'Идет генерация расписания...';
    this.autoGenerateSuccess = false;
    this.generatedDoctorNames = []; // Очищаем список врачей
    
    // Установка времени завершения в 23:00 для текущего дня
    const currentDate = new Date(this.autoGenerateStartDate);
    currentDate.setHours(23, 0, 0, 0);
    this.autoGenerateStartDate = this.formatDate(currentDate);
    
    // Создаем настройки расписания на основе формы
    const settings: ScheduleSettings = {
      doctorId: this.autoGenerateScope === 'selectedDoctor' ? this.selectedDoctorId : 
               (this.selectedDoctorId > 0 ? this.selectedDoctorId : 1),
      hospitalId: this.selectedHospitalId || 1,
      workdayStart: this.settingsForm.get('workdayStart')?.value,
      workdayEnd: this.settingsForm.get('workdayEnd')?.value,
      slotDuration: Number(this.settingsForm.get('slotDuration')?.value),
      breakDuration: Number(this.settingsForm.get('breakDuration')?.value),
      lunchStart: this.settingsForm.get('lunchStart')?.value,
      lunchEnd: this.settingsForm.get('lunchEnd')?.value,
      workDays: this.getWorkDaysString(),
      lunchBreak: true
    };
    
    // Создаем объект настроек автогенерации
    const autoGenSettings: AutoGenerationSettings = {
      isEnabled: true,
      scope: this.autoGenerateScope,
      periodType: this.autoGeneratePeriod,
      nextGenerationDate: this.autoGenerateStartDate,
      scheduleSettings: settings,
      autoGenerationSettingsId: this.autoGenerationInfo?.autoGenerationSettingsId
    };
    
    // Добавляем дополнительные параметры в зависимости от выбранной области применения
    if (this.autoGenerateScope === 'selectedHospital' && this.selectedHospitalId > 0) {
      autoGenSettings.hospitalId = this.selectedHospitalId;
    } else if (this.autoGenerateScope === 'selectedSpeciality' && this.selectedSpecialityId > 0) {
      autoGenSettings.hospitalId = this.selectedHospitalId;
      autoGenSettings.specialityId = this.selectedSpecialityId;
    } else if (this.autoGenerateScope === 'selectedDoctor' && this.selectedDoctorId > 0) {
      autoGenSettings.doctorId = this.selectedDoctorId;
    }
    
    // Сохраняем настройки автогенерации перед началом процесса генерации
    this.scheduleService.saveAutoGenerationSettings(autoGenSettings)
      .subscribe({
        next: (savedSettings) => {
          this.autoGenerationInfo = savedSettings;
          this.autoGenerationActive = savedSettings.isEnabled;
          
          // Создаем данные для автогенерации
          const autoGenerateData = {
            scope: this.autoGenerateScope,
            startDate: this.autoGenerateStartDate,
            endDate: this.autoGenerateEndDate,
            hospitalId: autoGenSettings.hospitalId,
            specialityId: autoGenSettings.specialityId,
            doctorId: autoGenSettings.doctorId,
            clearExistingSchedule: true, // Флаг для очистки существующего расписания
            settings: settings
          };
          
          // После сохранения настроек запускаем автогенерацию
          this.executeAutoGeneration(autoGenerateData);
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Неизвестная ошибка';
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.autoGenerateResult = `Ошибка: ${errorMessage}`;
          this.autoGenerateSuccess = false;
          console.error('Error saving auto generation settings:', error);
        }
      });
  }

  // Выполнение генерации расписания
  private executeAutoGeneration(autoGenerateData: any): void {
    // Отправляем запрос
    this.scheduleService.autoGenerateSchedule(autoGenerateData)
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          this.autoGenerateSuccess = true;
          
          const totalCount = result.totalCount || 0;
          const successCount = result.successCount || 0;
          
          // Если есть сообщение в ответе, используем его
          if (result.message) {
            this.autoGenerateResult = result.message;
            this.autoGenerateSuccess = false;
          } 
          // Если список врачей доступен, добавляем его в сообщение
          else if (result.doctorNames && Array.isArray(result.doctorNames) && result.doctorNames.length > 0) {
            // Сохраняем список врачей для отображения
            this.generatedDoctorNames = result.doctorNames;
            
            const doctorList = result.doctorNames.slice(0, 10).join(', ') + 
                             (result.doctorNames.length > 10 ? ' и ещё ' + (result.doctorNames.length - 10) + '...' : '');
            
            // Проверим, что даты не слишком далеко в будущее (проблема с отображением периода)
            const startDate = result.startDate ? new Date(result.startDate) : new Date(this.autoGenerateStartDate);
            const endDate = result.endDate ? new Date(result.endDate) : new Date(this.autoGenerateEndDate);
            
            // Форматируем даты для отображения
            const formattedStartDate = startDate.toLocaleDateString('ru-RU');
            const formattedEndDate = endDate.toLocaleDateString('ru-RU');
            
            this.autoGenerateResult = `Успешно создано ${successCount} из ${totalCount} расписаний. ` +
                                    `Период: ${formattedStartDate} - ${formattedEndDate}.`;
          }
          // Базовое сообщение об успехе
          else {
            // Форматируем даты для отображения
            const startDate = new Date(this.autoGenerateStartDate);
            const endDate = new Date(this.autoGenerateEndDate);
            const formattedStartDate = startDate.toLocaleDateString('ru-RU');
            const formattedEndDate = endDate.toLocaleDateString('ru-RU');
            
            this.autoGenerateResult = `Успешно создано ${successCount} из ${totalCount} расписаний ` +
                                    `на период ${formattedStartDate} - ${formattedEndDate}.`;
          }
          
          if (successCount === 0 && totalCount > 0) {
            this.autoGenerateSuccess = false;
            this.autoGenerateResult = `Не удалось создать ни одного расписания из ${totalCount} возможных. ` + 
                                    `Проверьте настройки и наличие врачей.`;
          }
          
          // Обновляем настройки для следующей генерации
          this.setupNextAutoGeneration();
          
          // Обновляем отображение календаря, если у нас выбран конкретный врач
          if (this.selectedDoctorId > 0 && this.autoGenerateScope === 'selectedDoctor') {
            this.loadSchedule();
          }
        },
        error: (error) => {
          this.isLoading = false;
          this.autoGenerateSuccess = false;
          
          let errorMessage = 'Произошла неизвестная ошибка при генерации расписания';
          
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.status === 400 && error.error) {
            // Попытка извлечь сообщение из ответа ошибки 400
            if (typeof error.error === 'object' && error.error.message) {
              errorMessage = error.error.message;
            } else if (typeof error.error === 'string') {
              errorMessage = error.error;
            }
          }
          
          this.autoGenerateResult = `Ошибка: ${errorMessage}`;
          console.error('Error during auto-generation of schedule:', error);
        }
      });
  }
  
  // Настройка следующей автоматической генерации
  setupNextAutoGeneration(): void {
    // Определение следующей даты генерации на основе настроек периода
    const nextStartDate = new Date(this.autoGenerateEndDate);
    nextStartDate.setDate(nextStartDate.getDate() + 1); // Начинаем со следующего дня после окончания текущего периода
    
    let nextEndDate = new Date(nextStartDate);
    
    switch (this.autoGeneratePeriod) {
      case 'week':
        // Добавляем 7 дней - неделя
        nextEndDate.setDate(nextStartDate.getDate() + 6); // -1 для включения текущего дня
        break;
      case 'month':
        // Добавляем 1 месяц
        nextEndDate.setMonth(nextStartDate.getMonth() + 1);
        nextEndDate.setDate(nextEndDate.getDate() - 1); // Последний день месяца
        break;
      case 'year':
        // Добавляем 1 год
        nextEndDate.setFullYear(nextStartDate.getFullYear() + 1);
        nextEndDate.setDate(nextEndDate.getDate() - 1); // Последний день года
        break;
    }
    
    // Обновление дат для следующей генерации
    this.autoGenerateStartDate = this.formatDate(nextStartDate);
    this.autoGenerateEndDate = this.formatDate(nextEndDate);
    
    console.log(`Следующая автогенерация расписания запланирована на период ${this.autoGenerateStartDate} - ${this.autoGenerateEndDate}`);
    
    // Если существуют настройки автогенерации, обновляем их
    if (this.autoGenerationInfo && this.autoGenerationInfo.autoGenerationSettingsId) {
      // Обновляем дату следующей генерации
      const updatedSettings = {
        ...this.autoGenerationInfo,
        nextGenerationDate: this.autoGenerateStartDate
      };
      
      // Сохраняем обновленные настройки
      this.scheduleService.saveAutoGenerationSettings(updatedSettings)
        .subscribe({
          next: (savedSettings) => {
            this.autoGenerationInfo = savedSettings;
            console.log('Настройки автогенерации обновлены для следующего периода');
          },
          error: (error) => {
            console.error('Ошибка при обновлении настроек автогенерации:', error);
          }
        });
    }
  }

  // Загрузка настроек автоматической генерации
  loadAutoGenerationSettings(): void {
    // Получаем настройки автогенерации от сервера
    this.scheduleService.getAutoGenerationSettings()
      .subscribe({
        next: (settings: AutoGenerationSettings[]) => {
          // Проверяем, есть ли настройки
          if (settings && settings.length > 0) {
            let activeSettings: AutoGenerationSettings | undefined;
            
            // Логика выбора настроек в зависимости от текущего выбора пользователя
            
            // 1. Если выбран врач, ищем настройки для него
            if (this.selectedDoctorId > 0) {
              // Ищем настройки для конкретного врача
              activeSettings = settings.find(s => s.isEnabled && s.doctorId === this.selectedDoctorId);
            }
            
            // 2. Если выбрана специальность, ищем для нее
            if (!activeSettings && this.selectedSpecialityId > 0 && this.selectedHospitalId > 0) {
              activeSettings = settings.find(s => 
                s.isEnabled && 
                s.scope === 'selectedSpeciality' && 
                s.specialityId === this.selectedSpecialityId &&
                s.hospitalId === this.selectedHospitalId
              );
            }
            
            // 3. Если выбрана больница, ищем для нее
            if (!activeSettings && this.selectedHospitalId > 0) {
              activeSettings = settings.find(s => 
                s.isEnabled && 
                s.scope === 'selectedHospital' && 
                s.hospitalId === this.selectedHospitalId
              );
            }
            
            // 4. Если администратор - проверяем глобальные настройки для всех
            if (!activeSettings && this.userRole === 'Administrator') {
              activeSettings = settings.find(s => 
                s.isEnabled && 
                s.scope === 'allHospitals'
              );
            }
            
            // 5. Если ничего не найдено, но есть активные настройки - берем первую активную
            if (!activeSettings) {
              activeSettings = settings.find(s => s.isEnabled);
            }
            
            // Если нашли активные настройки
            if (activeSettings) {
              // Сохраняем информацию о настройках
              this.autoGenerationInfo = activeSettings;
              
              // Устанавливаем значения из настроек
              this.autoGenerateEnabled = true;
              this.autoGenerateScope = activeSettings.scope;
              this.autoGeneratePeriod = activeSettings.periodType;
              this.autoGenerateStartDate = activeSettings.nextGenerationDate;
              
              // Устанавливаем флаг активности
              this.autoGenerationActive = true;
              
              // Устанавливаем настройки расписания, если они есть
              if (activeSettings.scheduleSettings) {
                // Заполнение данных формы
                const workDays = this.parseWorkDays(activeSettings.scheduleSettings.workDays);
                
                this.settingsForm.patchValue({
                  workdayStart: activeSettings.scheduleSettings.workdayStart,
                  workdayEnd: activeSettings.scheduleSettings.workdayEnd,
                  slotDuration: activeSettings.scheduleSettings.slotDuration,
                  breakDuration: activeSettings.scheduleSettings.breakDuration,
                  lunchStart: activeSettings.scheduleSettings.lunchStart,
                  lunchEnd: activeSettings.scheduleSettings.lunchEnd,
                  workDays: workDays
                });
              }
              
              // Расчет даты окончания на основе даты начала и периода
              this.calculateEndDate();
              
              // Установка конкретных селекторов в соответствии с настройками
              if (activeSettings.hospitalId && this.hasHospital(activeSettings.hospitalId)) {
                this.selectedHospitalId = activeSettings.hospitalId;
                this.onHospitalChange(activeSettings.hospitalId);
                
                if (activeSettings.specialityId) {
                  const hospId = Number(activeSettings.hospitalId);
                  this.loadSpecialities(hospId);
                  setTimeout(() => {
                    this.selectedSpecialityId = activeSettings.specialityId || 0;
                    this.onSpecialityChange(this.selectedSpecialityId);
                    
                    if (activeSettings.doctorId) {
                      // Проверяем специальность перед использованием
                      const specId = Number(activeSettings.specialityId || 0);
                      this.loadDoctorsBySpeciality(hospId, specId);
                      setTimeout(() => {
                        this.selectedDoctorId = activeSettings.doctorId || 0;
                      }, 500);
                    }
                  }, 500);
                }
              }
            } else {
              this.resetAutoGenerationSettings();
            }
          } else {
            this.resetAutoGenerationSettings();
          }
        },
        error: (error: any) => {
          console.error('Error loading auto generation settings:', error);
          this.resetAutoGenerationSettings();
        }
      });
  }

  // Сброс настроек автоматической генерации к значениям по умолчанию
  resetAutoGenerationSettings(): void {
    this.autoGenerateEnabled = false;
    this.autoGenerateScope = 'selectedDoctor';
    this.autoGeneratePeriod = 'month';
    
    // Создаем сегодняшнюю дату и убеждаемся, что время установлено в 00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    this.autoGenerateStartDate = this.formatDate(today);
    this.calculateEndDate();
    
    // Сбрасываем статус активности
    this.autoGenerationActive = false;
    this.autoGenerationInfo = null;
  }

  // Отключение автоматической генерации
  disableAutoGeneration(settingsId: number): void {
    if (!settingsId) {
      this.autoGenerateEnabled = false;
      this.autoGenerationActive = false;
      this.autoGenerationInfo = null;
      return;
    }

    this.isLoading = true;
    this.scheduleService.disableAutoGeneration(settingsId)
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.autoGenerateEnabled = false;
          this.autoGenerateResult = 'Автоматическая генерация отключена.';
          this.autoGenerateSuccess = true;
          
          // Обновляем статус активности
          this.autoGenerationActive = false;
          this.autoGenerationInfo = null;
        },
        error: (error) => {
          this.isLoading = false;
          let errorMessage = 'Неизвестная ошибка';
          this.generatedDoctorNames = []; // Очищаем список врачей
          if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.autoGenerateResult = `Ошибка при отключении автогенерации: ${errorMessage}`;
          this.autoGenerateSuccess = false;
          console.error('Error disabling auto generation:', error);
        }
      });
  }

  // Вспомогательный метод для получения строки рабочих дней
  getWorkDaysString(): string {
    const workDaysArray = this.settingsForm.get('workDays')?.value || [];
    return Array.isArray(workDaysArray) ? workDaysArray.join(',') : workDaysArray.toString();
  }

  // Сброс формы к значениям по умолчанию
  resetForm(): void {
    console.log('Сброс формы к значениям по умолчанию');
    
    // Сохраняем текущие значения doctorId и hospitalId
    const currentDoctorId = this.selectedDoctorId;
    const currentHospitalId = this.selectedHospitalId;
    
    this.settingsForm.patchValue({
      workdayStart: '08:00',
      workdayEnd: '17:00',
      slotDuration: 30,
      breakDuration: 5,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      workDays: [1, 2, 3, 4, 5], // По умолчанию ПН-ПТ
      doctorId: currentDoctorId, // Сохраняем текущее значение
      hospitalId: currentHospitalId // Сохраняем текущее значение
    });
    
    console.log('Форма сброшена, doctorId =', currentDoctorId, 'hospitalId =', currentHospitalId);
  }

  // Преобразование строки рабочих дней в массив
  parseWorkDays(workDays: string | any): number[] {
    let workDaysArray: number[] = [];
    
    if (workDays) {
      // Если workDays - строка, разбиваем по запятой и конвертируем в числа
      if (typeof workDays === 'string') {
        workDaysArray = workDays.split(',').map(day => parseInt(day.trim())).filter(day => !isNaN(day));
      } 
      // Если workDays уже массив, используем его как есть
      else if (Array.isArray(workDays)) {
        workDaysArray = workDays.map(d => Number(d)).filter(day => !isNaN(day));
      }
      // По умолчанию - пн-пт
      else {
        workDaysArray = [1, 2, 3, 4, 5];
      }
    } else {
      // По умолчанию - пн-пт
      workDaysArray = [1, 2, 3, 4, 5];
    }
    
    return workDaysArray;
  }

  // Переключение отображения панели автогенерации
  toggleAutoGenerationPanel(): void {
    this.isAutoGenerationPanelOpen = !this.isAutoGenerationPanelOpen;
    
    // При первом открытии загружаем настройки автогенерации
    if (this.isAutoGenerationPanelOpen && !this.autoGenerationInfo) {
      this.loadAutoGenerationSettings();
    }
  }

  // Отображение информации о текущих настройках автогенерации
  showAutoGenerationInfo(event: Event): void {
    event.stopPropagation(); // Предотвращаем сворачивание панели при клике на значок
    
    if (!this.autoGenerationInfo) {
      return;
    }
    
    // Формируем сообщение с информацией о настройках
    let scopeText = '';
    switch (this.autoGenerationInfo.scope) {
      case 'allHospitals':
        scopeText = 'все больницы';
        break;
      case 'selectedHospital':
        const hospitalName = this.findHospitalName(this.autoGenerationInfo.hospitalId);
        scopeText = `больницу "${hospitalName}"`;
        break;
      case 'selectedSpeciality':
        const hospitalForSpec = this.findHospitalName(this.autoGenerationInfo.hospitalId);
        const speciality = this.specialities.find(s => s.specialityId === this.autoGenerationInfo.specialityId);
        scopeText = `специальность "${speciality?.name || ''}" в больнице "${hospitalForSpec}"`;
        break;
      case 'selectedDoctor':
        const doctorName = this.findDoctorName(this.autoGenerationInfo.doctorId);
        scopeText = `врача "${doctorName}"`;
        break;
    }
    
    let periodText = '';
    switch (this.autoGenerationInfo.periodType) {
      case 'week':
        periodText = 'неделя';
        break;
      case 'month':
        periodText = 'месяц';
        break;
      case 'year':
        periodText = 'год';
        break;
    }
    
    // Форматируем дату
    const nextDate = new Date(this.autoGenerationInfo.nextGenerationDate);
    const formattedDate = `${nextDate.getDate().toString().padStart(2, '0')}.${(nextDate.getMonth() + 1).toString().padStart(2, '0')}.${nextDate.getFullYear()}`;
    
    const infoMessage = `Текущие настройки автогенерации:\n\n` +
                       `Область применения: ${scopeText}\n` +
                       `Период генерации: ${periodText}\n` +
                       `Следующая генерация: ${formattedDate}\n`;
    
    alert(infoMessage);
  }

  // Обработчик изменения типа периода автогенерации (неделя/месяц/год)
  onPeriodTypeChange(): void {
    this.calculateEndDate();
  }

  // Обработчик изменения начальной даты автогенерации
  onStartDateChange(): void {
    this.calculateEndDate();
  }

  // Сохраняет настройки автоматической генерации
  saveAutoGenerationSettings(): void {
    if (!this.canStartAutoGeneration()) {
      this.autoGenerateResult = 'Пожалуйста, заполните все необходимые поля';
      this.autoGenerateSuccess = false;
      return;
    }

    this.isLoading = true;
    
    // Создаем объект настроек расписания на основе формы
    const settings: ScheduleSettings = {
      doctorId: this.autoGenerateScope === 'selectedDoctor' ? this.selectedDoctorId : 
               (this.selectedDoctorId > 0 ? this.selectedDoctorId : 1),
      hospitalId: this.selectedHospitalId || 1,
      workdayStart: this.settingsForm.get('workdayStart')?.value,
      workdayEnd: this.settingsForm.get('workdayEnd')?.value,
      slotDuration: Number(this.settingsForm.get('slotDuration')?.value),
      breakDuration: Number(this.settingsForm.get('breakDuration')?.value),
      lunchStart: this.settingsForm.get('lunchStart')?.value,
      lunchEnd: this.settingsForm.get('lunchEnd')?.value,
      workDays: this.getWorkDaysString(),
      lunchBreak: true
    };
    
    // Создаем объект настроек автогенерации
    const autoGenSettings: AutoGenerationSettings = {
      isEnabled: true,
      scope: this.autoGenerateScope,
      periodType: this.autoGeneratePeriod,
      nextGenerationDate: this.autoGenerateStartDate,
      scheduleSettings: settings,
      autoGenerationSettingsId: this.autoGenerationInfo?.autoGenerationSettingsId
    };
    
    // Добавляем дополнительные параметры в зависимости от выбранной области применения
    if (this.autoGenerateScope === 'selectedHospital' && this.selectedHospitalId > 0) {
      autoGenSettings.hospitalId = this.selectedHospitalId;
    } else if (this.autoGenerateScope === 'selectedSpeciality' && this.selectedSpecialityId > 0) {
      autoGenSettings.hospitalId = this.selectedHospitalId;
      autoGenSettings.specialityId = this.selectedSpecialityId;
    } else if (this.autoGenerateScope === 'selectedDoctor' && this.selectedDoctorId > 0) {
      autoGenSettings.doctorId = this.selectedDoctorId;
    }
    
    this.scheduleService.saveAutoGenerationSettings(autoGenSettings).subscribe({
      next: (response: any) => {
        this.autoGenerateResult = 'Настройки автогенерации успешно сохранены';
        this.autoGenerateSuccess = true;
        this.autoGenerationInfo = response;
        this.autoGenerationActive = response.isEnabled;
        this.isLoading = false;
        this.loadAutoGenerationSettings(); // Перезагружаем настройки
      },
      error: (error: any) => {
        this.autoGenerateResult = 'Ошибка при сохранении настроек: ' + (error.message || 'Неизвестная ошибка');
        this.autoGenerateSuccess = false;
        this.isLoading = false;
        console.error('Ошибка сохранения настроек автогенерации:', error);
      }
    });
  }

  // Сброс всех выбранных значений
  resetSelections(): void {
    if (this.confirmAction('Вы уверены, что хотите сбросить все выбранные значения?')) {
      console.log('Сброс всех выбранных значений');
      
      this.selectedHospitalId = 0;
      this.selectedSpecialityId = 0;
      this.selectedDoctorId = 0;
      
      this.hospitals = [];
      this.specialities = [];
      this.doctors = [];
      
      this.resetForm();
      
      // Очищаем текущее расписание
      this.currentSchedule = null;
      this.buildEmptyCalendar();
      
      // Очищаем localStorage
      localStorage.removeItem('scheduleManagement_selectedValues');
      
      // Сбрасываем сообщения
      this.errorMessage = '';
      this.saveSuccess = false;
      
      // Если текущий пользователь - администратор, загружаем список больниц
      if (this.userRole === 'Administrator') {
        this.loadHospitals();
      }
    }
  }

  // Подтверждение действия через диалог
  confirmAction(message: string): boolean {
    return confirm(message);
  }
  
  // Добавляем новый метод для обработки ошибок получения настроек
  private getDefaultSettings(): ScheduleSettings {
    return {
      doctorId: this.selectedDoctorId,
      hospitalId: this.selectedHospitalId,
      workdayStart: '08:00',
      workdayEnd: '17:00',
      slotDuration: 30,
      breakDuration: 5,
      lunchStart: '12:00',
      lunchEnd: '13:00',
      workDays: '1,2,3,4,5',
      lunchBreak: true
    };
  }

  // Выбор врача
  onDoctorSelect(doctorId: number): void {
    console.log('Выбран врач с ID:', doctorId);
    
    // Убедимся, что doctorId не null и не 0
    if (!doctorId) {
      console.error('Ошибка: ID врача не передан');
      return;
    }
    
    // Сохраняем ID врача
    this.selectedDoctorId = doctorId;
    console.log('Сохранен ID врача:', this.selectedDoctorId);
    
    // Выбор врача на форме
    this.settingsForm.get('doctorId')?.setValue(doctorId);
    
    // Сохраняем значения в localStorage
    this.saveSelectedValuesToLocalStorage();
    
    // Загружаем настройки расписания выбранного врача
    this.loadDoctorSettings(doctorId);
  }

  // Установка дефолтных дат для периода расписания
  private setDefaultDates(): void {
    const today = new Date();
    // Начало периода - текущая дата
    this.startDate = today.toISOString().split('T')[0];
    
    // Конец периода - через 2 недели от текущей даты
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 14);
    this.endDate = endDate.toISOString().split('T')[0];
    
    console.log('Установлены дефолтные даты периода:', this.startDate, '-', this.endDate);
  }

  // Методы для работы со статистикой

  /**
   * Переключение видимости панели статистики
   */
  toggleStatisticsPanel(): void {
    this.isStatisticsPanelOpen = !this.isStatisticsPanelOpen;
    
    // Если панель открыли, загружаем статистику
    if (this.isStatisticsPanelOpen) {
      this.loadStatistics();
    }
  }

  /**
   * Загрузка статистики
   */
  loadStatistics(): void {
    this.isLoadingStatistics = true;
    
    // Формируем запрос на получение статистики
    const request: any = {
      scope: this.statisticsScope as StatisticsScope,
      period: this.statisticsPeriod as StatisticsPeriod,
      startFromToday: this.startFromToday
    };
    
    // Добавляем дополнительные параметры в зависимости от выбранной области
    if (this.statisticsScope === StatisticsScope.SelectedHospital && this.selectedHospitalId > 0) {
      request.hospitalId = this.selectedHospitalId;
    } else if (this.statisticsScope === StatisticsScope.SelectedSpecialty && this.selectedSpecialityId > 0) {
      request.hospitalId = this.selectedHospitalId;
      request.specialtyId = this.selectedSpecialityId;
    } else if (this.statisticsScope === StatisticsScope.SelectedDoctor && this.selectedDoctorId > 0) {
      request.doctorId = this.selectedDoctorId;
    }
    
    // Запрашиваем статистику
    this.statisticsService.getScheduleStatistics(request)
      .subscribe({
        next: (data) => {
          this.statistics = data;
          this.isLoadingStatistics = false;
          
          // Устанавливаем текущий диапазон дат
          this.calculateStatisticsDateRange(this.statisticsPeriod);
        },
        error: (error) => {
          console.error('Ошибка при загрузке статистики:', error);
          this.isLoadingStatistics = false;
          this.errorMessage = 'Не удалось загрузить статистику. Пожалуйста, попробуйте позже.';
        }
      });
  }

  /**
   * Обработчик изменения флага "начинать с сегодняшнего дня"
   */
  onStartFromTodayChange(): void {
    this.loadStatistics();
  }

  /**
   * Расчет диапазона дат для выбранного периода
   */
  calculateStatisticsDateRange(period: any): void {
    const today = new Date();
    let fromDate: Date, toDate: Date;
    
    switch (period) {
      case StatisticsPeriod.Day:
        fromDate = today;
        toDate = today;
        break;
      
      case StatisticsPeriod.Week:
        // Если установлен флаг "начинать с сегодняшнего дня"
        if (this.startFromToday) {
          fromDate = today;
          toDate = new Date(today);
          toDate.setDate(today.getDate() + 6); // Неделя вперед
        } else {
          // Получаем начало недели (понедельник)
          const dayOfWeek = today.getDay() || 7; // 0 - воскресенье, 1-6 - пн-сб
          const daysFromMonday = dayOfWeek - 1;
          fromDate = new Date(today);
          fromDate.setDate(today.getDate() - daysFromMonday);
          
          // Конец недели (воскресенье)
          toDate = new Date(fromDate);
          toDate.setDate(fromDate.getDate() + 6);
        }
        break;
      
      case StatisticsPeriod.Month:
        // Если установлен флаг "начинать с сегодняшнего дня"
        if (this.startFromToday) {
          fromDate = today;
          toDate = new Date(today);
          toDate.setMonth(today.getMonth() + 1);
          toDate.setDate(toDate.getDate() - 1); // Последний день следующего месяца
        } else {
          // Начало месяца
          fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
          // Конец месяца
          toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        break;
      
      case StatisticsPeriod.ThreeMonths:
        // Если установлен флаг "начинать с сегодняшнего дня"
        if (this.startFromToday) {
          fromDate = today;
          toDate = new Date(today);
          toDate.setMonth(today.getMonth() + 3);
          toDate.setDate(toDate.getDate() - 1);
        } else {
          // Начало 3-месячного периода (2 месяца назад)
          fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
          // Конец текущего месяца
          toDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        }
        break;
      
      case StatisticsPeriod.Year:
        // Если установлен флаг "начинать с сегодняшнего дня"
        if (this.startFromToday) {
          fromDate = today;
          toDate = new Date(today);
          toDate.setFullYear(today.getFullYear() + 1);
          toDate.setDate(toDate.getDate() - 1);
        } else {
          // Начало года
          fromDate = new Date(today.getFullYear(), 0, 1);
          // Конец года
          toDate = new Date(today.getFullYear(), 11, 31);
        }
        break;
        
      default:
        fromDate = today;
        toDate = today;
    }
    
    // Форматируем даты в строку
    const formatDate = (date: Date) => {
      return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    };
    
    this.statisticsDateRange = `${formatDate(fromDate)}-${formatDate(toDate)}`;
  }

  /**
   * Обработчик изменения области статистики
   */
  onStatisticsScopeChange(): void {
    // Проверяем, доступна ли выбранная область
    if (this.statisticsScope === StatisticsScope.SelectedHospital && this.selectedHospitalId === 0) {
      this.statisticsScope = StatisticsScope.AllHospitals;
    } else if (this.statisticsScope === StatisticsScope.SelectedSpecialty && 
              (this.selectedHospitalId === 0 || this.selectedSpecialityId === 0)) {
      this.statisticsScope = StatisticsScope.AllHospitals;
    } else if (this.statisticsScope === StatisticsScope.SelectedDoctor && this.selectedDoctorId === 0) {
      this.statisticsScope = StatisticsScope.AllHospitals;
    }
    
    // Загружаем статистику с новыми параметрами
    this.loadStatistics();
  }

  /**
   * Обработчик изменения периода статистики
   */
  onStatisticsPeriodChange(): void {
    // Обновляем диапазон дат для выбранного периода
    this.calculateStatisticsDateRange(this.statisticsPeriod);
    
    // Загружаем статистику с новыми параметрами
    this.loadStatistics();
  }
  
  /**
   * Получение названия выбранного объекта для отображения в статистике
   */
  getSelectedScopeTitle(): string {
    switch (this.statisticsScope) {
      case StatisticsScope.AllHospitals:
        return 'всех больниц';
      case StatisticsScope.SelectedHospital:
        return `больницы "${this.findHospitalName(this.selectedHospitalId)}"`;
      case StatisticsScope.SelectedSpecialty:
        const speciality = this.specialities.find(s => s.doctorsSpecialityId === this.selectedSpecialityId);
        return `специальности "${speciality ? speciality.name : 'Выбранная специальность'}"`;
      case StatisticsScope.SelectedDoctor:
        return `врача "${this.findDoctorName(this.selectedDoctorId)}"`;
      default:
        return 'выбранной области';
    }
  }
  
  /**
   * Получение названия выбранного периода для отображения в статистике
   */
  getSelectedPeriodTitle(): string {
    switch (this.statisticsPeriod) {
      case StatisticsPeriod.Day:
        return 'день';
      case StatisticsPeriod.Week:
        return 'неделю';
      case StatisticsPeriod.Month:
        return 'месяц';
      case StatisticsPeriod.ThreeMonths:
        return '3 месяца';
      case StatisticsPeriod.Year:
        return 'год';
      default:
        return 'выбранный период';
    }
  }

  /**
   * Обработчик изменения типа временного периода для статистики
   */
  onStatisticsTimePeriodChange(): void {
    switch (this.statisticsTimePeriod) {
      case 'default':
        this.statisticsStartHour = 8;
        this.statisticsEndHour = 18;
        break;
      case '24hour':
        this.statisticsStartHour = 0;
        this.statisticsEndHour = 23;
        break;
      case 'custom':
        this.statisticsStartHour = this.customStartHour;
        this.statisticsEndHour = this.customEndHour;
        break;
    }
    // Сохраняем настройки в localStorage
    this.saveStatisticsTimeSettings();
    
    // Вызываем обновление графика
    if (this.statistics && this.statistics.hourlyDistribution) {
      // Создаем shallow копию объекта статистики для вызова обновления представления
      this.statistics = {...this.statistics};
    }
  }

  /**
   * Обработчик изменения пользовательских часов начала и окончания
   */
  onCustomHoursChange(): void {
    if (this.statisticsTimePeriod === 'custom') {
      this.statisticsStartHour = this.customStartHour;
      this.statisticsEndHour = this.customEndHour;
      this.saveStatisticsTimeSettings();
      
      // Вызываем обновление графика
      if (this.statistics && this.statistics.hourlyDistribution) {
        // Создаем shallow копию объекта статистики для вызова обновления представления
        this.statistics = {...this.statistics};
      }
    }
  }

  /**
   * Сохранение настроек отображения временного периода в localStorage
   */
  saveStatisticsTimeSettings(): void {
    const settings = {
      timePeriod: this.statisticsTimePeriod,
      startHour: this.statisticsStartHour,
      endHour: this.statisticsEndHour,
      customStartHour: this.customStartHour,
      customEndHour: this.customEndHour
    };
    localStorage.setItem('scheduleManagement_statisticsTimeSettings', JSON.stringify(settings));
  }

  /**
   * Загрузка настроек отображения временного периода из localStorage
   */
  loadStatisticsTimeSettings(): void {
    const savedSettings = localStorage.getItem('scheduleManagement_statisticsTimeSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        this.statisticsTimePeriod = settings.timePeriod || 'default';
        this.statisticsStartHour = settings.startHour || 8;
        this.statisticsEndHour = settings.endHour || 18;
        this.customStartHour = settings.customStartHour || 8;
        this.customEndHour = settings.customEndHour || 18;
      } catch (error) {
        console.error('Ошибка при загрузке настроек временного периода:', error);
        this.resetStatisticsTimeSettings();
      }
    } else {
      this.resetStatisticsTimeSettings();
    }
  }

  /**
   * Сброс настроек отображения временного периода к значениям по умолчанию
   */
  resetStatisticsTimeSettings(): void {
    this.statisticsTimePeriod = 'default';
    this.statisticsStartHour = 8;
    this.statisticsEndHour = 18;
    this.customStartHour = 8;
    this.customEndHour = 18;
  }

  /**
   * Фильтрация почасовой статистики по выбранному временному периоду
   * @returns Отфильтрованный массив почасовой статистики
   */
  getFilteredHourlyDistribution(): any[] {
    if (!this.statistics || !this.statistics.hourlyDistribution) {
      return [];
    }

    // Фильтрация по часам
    return this.statistics.hourlyDistribution
      .filter(hourData => {
        const hour = parseInt(hourData.hour.split('-')[0]);
        return hour >= this.statisticsStartHour && hour <= this.statisticsEndHour;
      });
  }

  /**
   * Форматирование процентного значения с округлением до 2 знаков
   * @param value Значение в процентах
   * @returns Отформатированное значение с 2 знаками после запятой
   */
  formatPercentage(value: number): string {
    return value.toFixed(2);
  }

  /**
   * Изменение фильтра статусов
   */
  changeStatusFilter(filter: AppointmentStatusFilter): void {
    this.selectedStatusFilter = filter;
    // Вызываем обновление графика
    if (this.statistics && this.statistics.hourlyDistribution) {
      // Создаем shallow копию объекта статистики для вызова обновления представления
      this.statistics = {...this.statistics};
    }
  }

  /**
   * Получение количества записей для выбранного часа и статуса
   */
  getFilteredAppointmentsCount(hourData: any): number {
    switch (this.selectedStatusFilter) {
      case AppointmentStatusFilter.Completed:
        return hourData.completedAppointments;
      case AppointmentStatusFilter.Waiting:
        return hourData.waitingAppointments;
      case AppointmentStatusFilter.Cancelled:
        return hourData.cancelledAppointments;
      case AppointmentStatusFilter.All:
      default:
        return hourData.totalAppointments;
    }
  }

  /**
   * Получение высоты столбца для графика в зависимости от статуса
   * Высота вычисляется как процент от максимальной высоты графика,
   * где максимальное значение на шкале соответствует 100% высоты
   */
  getBarHeight(hourData: any, status: AppointmentStatusFilter): number {
    // Находим максимальное значение для масштабирования (наибольшая метка на шкале)
    const maxValue = Math.max(...this.getYAxisMarks());
    if (maxValue === 0) return 0;
    
    // Возвращаем абсолютную высоту в процентах от максимального значения
    switch (status) {
      case AppointmentStatusFilter.Completed:
        return (hourData.completedAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Waiting:
        return (hourData.waitingAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Cancelled:
        return (hourData.cancelledAppointments / maxValue) * 100;
      default:
        return 0;
    }
  }

  /**
   * Получение меток для оси Y (шкалы значений)
   */
  getYAxisMarks(): number[] {
    // Определяем максимальное значение
    const maxValue = this.getMaxAppointmentValue();
    
    if (maxValue === 0) {
      return [10, 8, 6, 4, 2, 0]; // Дефолтные значения в обратном порядке
    }
    
    // Создаем 6 равномерных делений для шкалы (начиная с максимума и заканчивая нулем)
    const marks = [];
    const step = Math.ceil(maxValue / 5);
    
    // Добавляем метки от максимума до 0
    for (let i = 5; i >= 0; i--) {
      marks.push(i * step);
    }
    
    return marks;
  }
  
  /**
   * Получение высоты столбца для дня недели в зависимости от статуса
   * Высота вычисляется как процент от максимальной высоты графика,
   * где максимальное значение на шкале соответствует 100% высоты
   */
  getBarHeightForWeekday(day: any, status: AppointmentStatusFilter): number {
    // Используем максимальное значение шкалы Y
    const maxValue = Math.max(...this.getYAxisMarks());
    if (maxValue === 0) return 0;
    
    // Возвращаем абсолютную высоту в процентах от максимального значения
    switch (status) {
      case AppointmentStatusFilter.Completed:
        return (day.completedAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Waiting:
        return (day.waitingAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Cancelled:
        return (day.cancelledAppointments / maxValue) * 100;
      default:
        return 0;
    }
  }
  
  /**
   * Вычисление загруженности для дня недели
   * Загруженность = количество записей / общее количество доступных слотов * 100%
   */
  getWeekdayOccupancyRate(day: any): number {
    if (!day || !this.statistics || this.statistics.totalSlots === 0) {
      return 0;
    }
    
    // Для примера - рассчитываем загруженность как отношение всех записей к общему числу слотов
    // Предполагаем равномерное распределение слотов по 7 дням недели
    const slotsPerDay = this.statistics.totalSlots / 7;
    if (slotsPerDay === 0) return 0;
    
    return (day.totalAppointments / slotsPerDay) * 100;
  }
  
  /**
   * Вычисление средней загруженности для почасовой статистики
   * Использует значение rate для каждого часа, предоставленное бэкендом
   */
  getHourlyAverageRate(): number {
    if (!this.statistics || !this.statistics.hourlyDistribution) {
      return 0;
    }
    
    // Фильтруем часы по выбранному временному диапазону
    const filteredHours = this.getFilteredHourlyDistribution();
    
    if (filteredHours.length === 0) {
      return 0;
    }
    
    // Вычисляем среднее значение загруженности из данных, полученных с сервера
    const totalRate = filteredHours.reduce((sum, hour) => sum + (hour.rate || 0), 0);
    return totalRate / filteredHours.length;
  }
  
  /**
   * Вычисление средней загруженности для статистики по дням недели
   */
  getWeekdayAverageRate(): number {
    if (!this.statistics || !this.statistics.weekdayDistribution || !this.statistics.totalSlots) {
      return 0;
    }
    
    if (this.statistics.totalSlots === 0) {
      return 0;
    }
    
    // Суммируем все записи по дням и делим на общее количество слотов
    const totalAppointments = this.getWeekdayTotal('totalAppointments');
    return (totalAppointments / this.statistics.totalSlots) * 100;
  }
  
  /**
   * Вычисление суммы для выбранного поля в почасовом распределении
   */
  getHourlyTotal(field: string): number {
    if (!this.statistics || !this.statistics.hourlyDistribution) {
      return 0;
    }
    
    // Фильтруем часы по выбранному временному диапазону
    const filteredHours = this.getFilteredHourlyDistribution();
    
    // Суммируем значения выбранного поля
    return filteredHours.reduce((sum, hour) => sum + (hour[field] || 0), 0);
  }
  
  /**
   * Вычисление суммы для выбранного поля в распределении по дням недели
   */
  getWeekdayTotal(field: string): number {
    if (!this.statistics || !this.statistics.weekdayDistribution) {
      return 0;
    }
    
    const weekdays = this.getWeekdayDistribution();
    
    // Суммируем значения выбранного поля
    return weekdays.reduce((sum, day) => sum + (day[field] || 0), 0);
  }

  /**
   * Получение данных распределения по дням недели
   */
  getWeekdayDistribution(): any[] {
    if (!this.statistics) {
      return [];
    }
    
    // Если с сервера пришли реальные данные, используем их
    if (this.statistics.weekdayDistribution && this.statistics.weekdayDistribution.length > 0) {
      return this.statistics.weekdayDistribution;
    }
    
    // Если данных нет, создаем заглушку для тестирования интерфейса
    const weekdays = [
      { dayOfWeek: 1, name: 'ПН', totalAppointments: 0, completedAppointments: 0, waitingAppointments: 0, cancelledAppointments: 0, rate: 0 },
      { dayOfWeek: 2, name: 'ВТ', totalAppointments: 0, completedAppointments: 0, waitingAppointments: 0, cancelledAppointments: 0, rate: 0 },
      { dayOfWeek: 3, name: 'СР', totalAppointments: 0, completedAppointments: 0, waitingAppointments: 0, cancelledAppointments: 0, rate: 0 },
      { dayOfWeek: 4, name: 'ЧТ', totalAppointments: 0, completedAppointments: 0, waitingAppointments: 0, cancelledAppointments: 0, rate: 0 },
      { dayOfWeek: 5, name: 'ПТ', totalAppointments: 0, completedAppointments: 0, waitingAppointments: 0, cancelledAppointments: 0, rate: 0 },
      { dayOfWeek: 6, name: 'СБ', totalAppointments: 0, completedAppointments: 0, waitingAppointments: 0, cancelledAppointments: 0, rate: 0 },
      { dayOfWeek: 7, name: 'ВС', totalAppointments: 0, completedAppointments: 0, waitingAppointments: 0, cancelledAppointments: 0, rate: 0 }
    ];
    
    return weekdays;
  }
  
  /**
   * Получение количества записей для выбранного дня недели и статуса
   */
  getFilteredAppointmentsCountForWeekday(day: any): number {
    switch (this.selectedStatusFilter) {
      case AppointmentStatusFilter.Completed:
        return day.completedAppointments;
      case AppointmentStatusFilter.Waiting:
        return day.waitingAppointments;
      case AppointmentStatusFilter.Cancelled:
        return day.cancelledAppointments;
      case AppointmentStatusFilter.All:
      default:
        return day.totalAppointments;
    }
  }

  /**
   * Переключение видимости таблицы с детальными данными по часам
   */
  toggleHourlyTable(): void {
    this.showHourlyTable = !this.showHourlyTable;
  }

  /**
   * Переключение видимости таблицы с детальными данными по дням недели
   */
  toggleWeekdayTable(): void {
    this.showWeekdayTable = !this.showWeekdayTable;
  }

  /**
   * Получение названия дня недели по его ID
   */
  getWeekdayName(dayId: number): string {
    const weekday = this.weekdays.find(d => d.id === dayId);
    return weekday ? weekday.name : `День ${dayId}`;
  }

  /**
   * Определение максимального количества записей для масштабирования графиков
   */
  getMaxAppointmentValue(): number {
    if (!this.statistics) return 0;
    
    let maxValue = 0;
    
    // Проверяем данные по часам
    if (this.statistics.hourlyDistribution && this.statistics.hourlyDistribution.length > 0) {
      const hourlyMax = Math.max(...this.statistics.hourlyDistribution.map(h => {
        if (this.selectedStatusFilter === AppointmentStatusFilter.All) {
          return h.totalAppointments;
        } else if (this.selectedStatusFilter === AppointmentStatusFilter.Completed) {
          return h.completedAppointments;
        } else if (this.selectedStatusFilter === AppointmentStatusFilter.Waiting) {
          return h.waitingAppointments;
        } else if (this.selectedStatusFilter === AppointmentStatusFilter.Cancelled) {
          return h.cancelledAppointments;
        }
        return 0;
      }));
      maxValue = Math.max(maxValue, hourlyMax);
    }
    
    // Проверяем данные по дням недели
    if (this.statistics.weekdayDistribution && this.statistics.weekdayDistribution.length > 0) {
      const weekdayMax = Math.max(...this.statistics.weekdayDistribution.map(d => {
        if (this.selectedStatusFilter === AppointmentStatusFilter.All) {
          return d.totalAppointments;
        } else if (this.selectedStatusFilter === AppointmentStatusFilter.Completed) {
          return d.completedAppointments;
        } else if (this.selectedStatusFilter === AppointmentStatusFilter.Waiting) {
          return d.waitingAppointments;
        } else if (this.selectedStatusFilter === AppointmentStatusFilter.Cancelled) {
          return d.cancelledAppointments;
        }
        return 0;
      }));
      maxValue = Math.max(maxValue, weekdayMax);
    }
    
    // Округляем до ближайшего большего целого числа
    return Math.ceil(maxValue);
  }

  /**
   * Получает максимальное значение меток оси Y
   */
  getMaxYAxisValue(): number {
    return Math.max(...this.getYAxisMarks());
  }
  
  /**
   * Вычисляет процент высоты столбца для часовых данных
   * Используется в шаблоне для избежания оператора spread
   */
  getBarHeightPercentage(hour: any, status: AppointmentStatusFilter): number {
    const maxValue = this.getMaxYAxisValue();
    if (maxValue === 0) return 0;
    
    switch (status) {
      case AppointmentStatusFilter.Completed:
        return (hour.completedAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Waiting:
        return (hour.waitingAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Cancelled:
        return (hour.cancelledAppointments / maxValue) * 100;
      case AppointmentStatusFilter.All:
        return (this.getFilteredAppointmentsCount(hour) / maxValue) * 100;
      default:
        return 0;
    }
  }
  
  /**
   * Вычисляет процент высоты столбца для данных по дням недели
   * Используется в шаблоне для избежания оператора spread
   */
  getBarHeightPercentageForWeekday(day: any, status: AppointmentStatusFilter): number {
    const maxValue = this.getMaxYAxisValue();
    if (maxValue === 0) return 0;
    
    switch (status) {
      case AppointmentStatusFilter.Completed:
        return (day.completedAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Waiting:
        return (day.waitingAppointments / maxValue) * 100;
      case AppointmentStatusFilter.Cancelled:
        return (day.cancelledAppointments / maxValue) * 100;
      case AppointmentStatusFilter.All:
        return (this.getFilteredAppointmentsCountForWeekday(day) / maxValue) * 100;
      default:
        return 0;
    }
  }

  /**
   * Загрузка рекомендаций по оптимизации расписания
   */
  loadScheduleOptimization(): void {
    if (!this.selectedDoctorId && !this.selectedHospitalId && !this.selectedSpecialityId) {
      return;
    }

    this.isLoadingOptimization = true;

    // Формируем запрос на получение оптимизаций
    const request: any = {
      scope: this.statisticsScope as StatisticsScope,
      period: this.statisticsPeriod as StatisticsPeriod,
      startFromToday: this.startFromToday
    };

    // Добавляем дополнительные параметры в зависимости от выбранной области
    if (this.selectedDoctorId > 0) {
      request.scope = StatisticsScope.SelectedDoctor;
      request.doctorId = this.selectedDoctorId;
    } else if (this.selectedSpecialityId > 0) {
      request.scope = StatisticsScope.SelectedSpecialty;
      request.specialtyId = this.selectedSpecialityId;
      request.hospitalId = this.selectedHospitalId;
    } else if (this.selectedHospitalId > 0) {
      request.scope = StatisticsScope.SelectedHospital;
      request.hospitalId = this.selectedHospitalId;
    }

    // Запрашиваем оптимизации
    this.statisticsService.getScheduleOptimization(request)
      .subscribe({
        next: (data) => {
          this.scheduleOptimization = data;
          this.isLoadingOptimization = false;

          // Показываем уведомление, если есть необходимость в оптимизации
          if (data.slotDurationOptimization.optimizationRequired) {
            this.showOptimizationNotification = true;
            // Автоматически скрываем уведомление через 10 секунд
            setTimeout(() => {
              this.showOptimizationNotification = false;
            }, 10000);
          }
        },
        error: (error) => {
          console.error('Ошибка при загрузке рекомендаций по оптимизации:', error);
          this.isLoadingOptimization = false;
          this.errorMessage = 'Не удалось загрузить рекомендации по оптимизации. Пожалуйста, попробуйте позже.';
        }
      });
  }

  /**
   * Переключение отображения панели оптимизации
   */
  toggleOptimizationPanel(): void {
    this.showOptimizationPanel = !this.showOptimizationPanel;

    // Если панель открыли, загружаем рекомендации
    if (this.showOptimizationPanel) {
      this.loadScheduleOptimization();
    }
  }

  /**
   * Начинает периодическую проверку необходимости оптимизации расписания
   */
  startOptimizationCheck(): void {
    // Проверяем оптимизацию при загрузке компонента
    setTimeout(() => {
      this.checkOptimizationNeeded();
    }, 5000);

    // Запускаем периодическую проверку каждый час
    this.optimizationCheckInterval = setInterval(() => {
      this.checkOptimizationNeeded();
    }, 3600000); // 1 час
  }

  /**
   * Проверка необходимости оптимизации расписания
   */
  checkOptimizationNeeded(): void {
    // Проверка выполняется только если выбран врач, больница или специальность
    if (!(this.selectedDoctorId || this.selectedHospitalId || this.selectedSpecialityId)) {
      return;
    }

    // Получаем дату последней проверки из localStorage
    const lastCheckDateStr = localStorage.getItem('lastOptimizationCheckDate');
    const today = new Date();
    let shouldCheck = false;

    if (!lastCheckDateStr) {
      // Если никогда не проверялось, выполняем проверку
      shouldCheck = true;
    } else {
      const lastCheckDate = new Date(lastCheckDateStr);
      const diffTime = Math.abs(today.getTime() - lastCheckDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Проверяем каждые 7 дней
      shouldCheck = diffDays >= 7;
    }

    // Также проверяем дату следующей автоматической генерации
    if (this.autoGenerationInfo && this.autoGenerationInfo.nextGenerationDate) {
      const nextGenDate = new Date(this.autoGenerationInfo.nextGenerationDate);
      
      // Если дата следующей генерации - в течение ближайших 3 дней
      const timeDiff = nextGenDate.getTime() - today.getTime();
      const daysDiff = timeDiff / (1000 * 3600 * 24);
      
      if (daysDiff <= 3 && daysDiff >= 0) {
        shouldCheck = true;
      }
    }

    // Если нужна проверка, загружаем рекомендации
    if (shouldCheck) {
      this.loadScheduleOptimization();
      
      // Сохраняем дату проверки
      localStorage.setItem('lastOptimizationCheckDate', today.toString());
    }
  }

  /**
   * Применение рекомендованной оптимизации
   */
  applyOptimization(): void {
    if (!this.scheduleOptimization || !this.scheduleOptimization.slotDurationOptimization.optimizationRequired) {
      return;
    }

    const recommendedDuration = this.scheduleOptimization.recommendedSlotDuration;
    
    // Обновляем значение длительности приема в форме
    this.settingsForm.patchValue({
      slotDuration: recommendedDuration
    });

    // Сохраняем настройки
    this.saveSettings();

    // Обновляем флаг, что оптимизация применена
    this.optimizationApplied = true;
    
    // Скрываем уведомление
    this.showOptimizationNotification = false;

    // Обновляем статус оптимизации
    setTimeout(() => {
      this.loadScheduleOptimization();
    }, 1000);
  }

  /**
   * Анализ тенденций загруженности для более точных рекомендаций
   * Метод анализирует исторические данные для определения трендов
   * и выдачи более точных рекомендаций по оптимизации
   */
  analyzeTrends(): void {
    if (!this.scheduleOptimization) {
      return;
    }

    this.isLoadingOptimization = true;
    
    // Параметры запроса для анализа трендов
    const request: any = {
      scope: this.statisticsScope as StatisticsScope,
      period: this.statisticsPeriod as StatisticsPeriod,
      startFromToday: this.startFromToday
    };
    
    // Добавляем идентификаторы в зависимости от области
    if (this.selectedDoctorId > 0) {
      request.doctorId = this.selectedDoctorId;
    } else if (this.selectedSpecialityId > 0) {
      request.specialtyId = this.selectedSpecialityId;
      request.hospitalId = this.selectedHospitalId;
    } else if (this.selectedHospitalId > 0) {
      request.hospitalId = this.selectedHospitalId;
    }
    
    // Получаем анализ трендов от API
    this.statisticsService.getScheduleTrends(request)
      .subscribe({
        next: (trends) => {
          // Сохраняем информацию о трендах для отображения
          this.optimizationTrendInfo = {
            description: trends.description,
            trends: trends
          };
          
          this.isLoadingOptimization = false;
        },
        error: (error) => {
          console.error('Ошибка при анализе тенденций:', error);
          this.isLoadingOptimization = false;
        }
      });
  }
  


  /**
   * Закрытие уведомления об оптимизации
   */
  closeOptimizationNotification(): void {
    this.showOptimizationNotification = false;
  }

  /**
   * Уничтожение компонента
   */
  ngOnDestroy(): void {
    // Очищаем интервал проверки оптимизации
    if (this.optimizationCheckInterval) {
      clearInterval(this.optimizationCheckInterval);
    }
  }
} 