import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService, UserInfo } from '../../../core/services/auth.service';
import { ScheduleService } from '../../../core/services/schedule.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { RoleOfUser } from '../../../shared/interfaces/user.interface';
import { Hospital, Speciality, DoctorDetails } from '../../../shared/interfaces/order.interface';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

// Enum для статусов талонов
export enum AppointmentStatus {
  All = 0,
  Waiting = 4,
  Completed = 1,
  Cancelled = 3
}

@Component({
  selector: 'app-appointments-management',
  templateUrl: './appointments-management.component.html',
  styleUrls: ['./appointments-management.component.scss']
})
export class AppointmentsManagementComponent implements OnInit, OnDestroy {
  // Form related
  filterForm!: FormGroup;
  
  // Data collections
  hospitals: Hospital[] = [];
  specialties: Speciality[] = [];
  doctors: DoctorDetails[] = [];
  appointments: any[] = [];
  
  // User role (matching schedule-management approach)
  userRole: string = '';
  
  // Current user info
  currentUser: any = {};
  
  // Additional properties
  doctorId?: number;
  hospitalId: number | null = null;
  
  // Отслеживание выбранных фильтров
  selectedFilters = {
    hospitalId: 0,
    specialtyId: 0,
    doctorId: 0,
    dateFrom: '',
    dateTo: ''
  };
  
  // Флаги загрузки
  loading = {
    hospitals: false,
    specialties: false,
    doctors: false,
    appointments: false
  };
  
  // Фильтр по статусу
  statusFilter: number = AppointmentStatus.All;
  AppointmentStatus = AppointmentStatus; // Делаем enum доступным в шаблоне
  
  // Текущая дата для отображения и фильтрации
  today: string = '';
  
  // Подписки
  private subscriptions = new Subscription();

  constructor(
    private formBuilder: FormBuilder,
    private orderService: OrderService,
    private authService: AuthService,
    private scheduleService: ScheduleService,
    private appointmentService: AppointmentService
  ) {
    // Get today's date in YYYY-MM-DD format using our helper
    this.today = this.getTodayDateString();
    console.log('Today date for initialization:', this.today);
    
    // Create form with today's date
    this.filterForm = this.formBuilder.group({
      hospitalId: [0],
      specialtyId: [0],
      doctorId: [0],
      dateFrom: [this.today],
      dateTo: [this.today]
    });
  }

  ngOnInit(): void {
    // Получаем информацию о пользователе
    const userInfo = this.authService.getUserInfo();
    this.currentUser = userInfo || {};
    
    // Устанавливаем роль пользователя (вместо флагов)
    if (userInfo?.role) {
      this.userRole = userInfo.role;
    } else if (this.authService.hasAdminAccess()) {
      this.userRole = 'Administrator';
    } else {
      this.userRole = 'Patient'; // Роль по умолчанию
    }
    
    console.log('Current user role:', this.userRole);
    
    // Get today's date and update both the form and filters
    const today = this.getTodayDateString();
    console.log('Today date from ngOnInit:', today);
    
    this.selectedFilters.dateFrom = today;
    this.selectedFilters.dateTo = today;
    
    // Explicitly set form values in case they weren't set properly in constructor
    this.filterForm.get('dateFrom')?.setValue(today);
    this.filterForm.get('dateTo')?.setValue(today);
    
    // Загрузка данных, в зависимости от роли
    if (this.userRole === 'Administrator') {
      this.loadHospitals();
    } else if (this.userRole === 'ChiefDoctor') {
      // Загрузка данных больницы главврача
      this.loadChiefDoctorHospital();
    } else if (this.userRole === 'Doctor') {
      // Загрузка данных врача
      this.loadDoctorData();
    }
    
    // Подписка на изменения формы
    this.subscribeToFormChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  // Проверка, валиден ли фильтр для применения
  isFilterValid(): boolean {
    const values = this.filterForm.getRawValue();
    
    if (this.userRole === 'Administrator') {
      // Для админа нужен выбор больницы, специальности и врача
      return values.hospitalId > 0 && values.specialtyId > 0 && values.doctorId > 0;
    } else if (this.userRole === 'ChiefDoctor') {
      // Для главврача нужен выбор специальности и врача
      return values.specialtyId > 0 && values.doctorId > 0;
    } else if (this.userRole === 'Doctor') {
      // Для врача всегда валидно
      return true;
    }
    
    return false;
  }

  // Загрузка больниц для админа
  loadHospitals(): void {
    this.loading.hospitals = true;
    this.disableFormControls(true, true, true);
    
    const hospitalsSub = this.orderService.getHospitals().subscribe({
      next: (hospitals: Hospital[]) => {
        this.hospitals = hospitals;
        this.loading.hospitals = false;
        this.disableFormControls(false, true, true);
      },
      error: (error: any) => {
        console.error('Ошибка при загрузке больниц:', error);
        this.loading.hospitals = false;
        this.disableFormControls(false, true, true);
      }
    });
    
    this.subscriptions.add(hospitalsSub);
  }

  // Загрузка больницы для главврача
  loadChiefDoctorHospital(): void {
    const userInfo = this.authService.getUserInfo();
    
    if (!userInfo) {
      console.error('Не удалось получить информацию о пользователе');
      return;
    }
    
    // Для главврача в системе должна быть связь между userId и hospitalId
    // Это может потребовать дополнительного запроса к API
    // В этом примере мы используем упрощённую модель

    // Здесь можно сделать дополнительный запрос к API для получения hospitalId
    // Например: this.scheduleService.getChiefDoctorInfo(userInfo.userId)
    
    // Временное решение для демонстрации
    // В реальной системе hospitalId должен приходить из API или из токена
    const hospitalId = 1; // Предполагаем, что это ID больницы главврача
    
    this.hospitalId = hospitalId;
    
    this.loading.hospitals = true;
    
    // Загружаем все больницы чтобы отобразить название больницы главврача
    const chiefHospitalSub = this.orderService.getHospitals().subscribe({
      next: (hospitals: Hospital[]) => {
        if (hospitals && hospitals.length > 0) {
          this.hospitals = hospitals;
          
          // Устанавливаем значение больницы в форме и отключаем поле выбора больницы
          this.filterForm.get('hospitalId')?.setValue(this.hospitalId);
          this.filterForm.get('hospitalId')?.disable();
          
          // Проверяем, что hospitalId не null перед присвоением
          if (this.hospitalId !== null) {
            this.selectedFilters.hospitalId = this.hospitalId;
            
            // Загрузка специальностей для этой больницы
            this.loadSpecialties(this.hospitalId);
          }
        }
        this.loading.hospitals = false;
      },
      error: (error: any) => {
        console.error('Ошибка при загрузке больницы главврача:', error);
        this.loading.hospitals = false;
      }
    });
    
    this.subscriptions.add(chiefHospitalSub);
  }

  // Загрузка данных для врача
  loadDoctorData(): void {
    // Получаем информацию о пользователе
    const userInfo = this.authService.getUserInfo();
    
    if (!userInfo) {
      console.error('Не удалось получить информацию о пользователе');
      return;
    }
    
    // Для врача в системе должна быть связь между userId и doctorId
    // Это может потребовать дополнительного запроса к API
    // В этом примере мы используем упрощённую модель

    // Здесь можно сделать дополнительный запрос к API для получения doctorId
    // Например: this.scheduleService.getDoctorInfoByUserId(userInfo.userId)
    
    // Временное решение для демонстрации
    // В реальной системе doctorId должен приходить из API или из токена
    const doctorId = 1; // Предполагаем, что это ID текущего врача
    const hospitalId = 1; // Предполагаем, что это ID больницы врача
    
    this.doctorId = doctorId;
    this.hospitalId = hospitalId;
    
    // Get today's date using our helper
    const today = this.getTodayDateString();
    console.log('Today date for doctor data:', today);
    
    // Обновляем выбранные фильтры
    this.selectedFilters = {
      hospitalId: this.hospitalId,
      specialtyId: 0,
      doctorId: this.doctorId,
      dateFrom: today,
      dateTo: today
    };
    
    // Также обновляем значения формы
    this.filterForm.get('dateFrom')?.setValue(today);
    this.filterForm.get('dateTo')?.setValue(today);
    
    console.log('Врач ID:', this.doctorId, 'Больница ID:', this.hospitalId);
    console.log('Дата с:', today, 'Дата по:', today);
    
    // Отключаем поля формы кроме даты для врача
    this.disableFormFieldsForDoctor();
    
    // Загружаем талоны врача на сегодня
    this.loadAppointments();
  }

  // Загрузка специальностей для выбранной больницы
  loadSpecialties(hospitalId: number): void {
    if (!hospitalId) return;
    
    this.loading.specialties = true;
    this.specialties = [];
    this.disableFormControls(this.userRole === 'ChiefDoctor', true, true);
    
    const specialtiesSub = this.orderService.getSpecialities(hospitalId).subscribe({
      next: (specialties: Speciality[]) => {
        this.specialties = specialties;
        this.loading.specialties = false;
        this.disableFormControls(this.userRole === 'ChiefDoctor', false, true);
      },
      error: (error: any) => {
        console.error('Ошибка при загрузке специальностей:', error);
        this.loading.specialties = false;
        this.disableFormControls(this.userRole === 'ChiefDoctor', false, true);
      }
    });
    
    this.subscriptions.add(specialtiesSub);
  }

  // Загрузка врачей для выбранной больницы и специальности
  loadDoctors(hospitalId: number, specialtyId: number): void {
    if (!hospitalId || !specialtyId) return;
    
    this.loading.doctors = true;
    this.doctors = [];
    this.disableFormControls(this.userRole === 'ChiefDoctor', false, true);
    
    const doctorsSub = this.orderService.getDoctorsBySpecialityAndHospital(hospitalId, specialtyId).subscribe({
      next: (doctors: DoctorDetails[]) => {
        this.doctors = doctors;
        this.loading.doctors = false;
        this.disableFormControls(this.userRole === 'ChiefDoctor', false, false);
      },
      error: (error: any) => {
        console.error('Ошибка при загрузке врачей:', error);
        this.loading.doctors = false;
        this.disableFormControls(this.userRole === 'ChiefDoctor', false, false);
      }
    });
    
    this.subscriptions.add(doctorsSub);
  }

  // Загрузка талонов с применением фильтров
  loadAppointments(): void {
    this.loading.appointments = true;
    
    // Build filters object
    const filters: any = {};

    if (this.userRole === 'Administrator') {
      const hospitalId = +this.filterForm.get('hospitalId')?.value;
      if (hospitalId > 0) {
        filters.hospitalId = hospitalId;
      }
    } else if (this.userRole === 'ChiefDoctor') {
      if (this.currentUser.hospitalId) {
        filters.hospitalId = this.currentUser.hospitalId;
      } else if (this.hospitalId) {
        // If not in currentUser, try the class property
        filters.hospitalId = this.hospitalId;
      }
    }

    if (this.filterForm.get('doctorId')?.value > 0) {
      filters.doctorId = +this.filterForm.get('doctorId')?.value;
    } else if (this.userRole === 'Doctor') {
      if (this.currentUser.doctorId) {
        filters.doctorId = this.currentUser.doctorId;
      } else if (this.doctorId) {
        // If not in currentUser, try the class property
        filters.doctorId = this.doctorId;
      }
    }

    // Apply date filters - ensure we have valid dates
    const dateFrom = this.filterForm.get('dateFrom')?.value;
    if (dateFrom) {
      filters.dateFrom = dateFrom;
      console.log('Using dateFrom:', dateFrom);
    } else {
      // Fallback to today if no date is set
      const today = this.getTodayDateString();
      filters.dateFrom = today;
      console.log('Fallback to today for dateFrom:', today);
    }

    const dateTo = this.filterForm.get('dateTo')?.value;
    if (dateTo) {
      filters.dateTo = dateTo;
      console.log('Using dateTo:', dateTo);
    } else {
      // Fallback to today if no date is set
      const today = this.getTodayDateString();
      filters.dateTo = today;
      console.log('Fallback to today for dateTo:', today);
    }

    // Set status filter if applicable (except for "All")
    if (this.statusFilter !== AppointmentStatus.All) {
      filters.receptionStatusId = this.getStatusIdByEnum(this.statusFilter);
    }

    // Save the current filters
    this.selectedFilters = {...filters};
    console.log('Applied filters:', filters);

    // Call the service method to fetch filtered appointments
    this.appointmentService.getFilteredAppointments(filters)
      .subscribe(
        (data) => {
          this.appointments = data;
          this.loading.appointments = false;
          console.log('Loaded appointments:', data.length);
        },
        (error) => {
          console.error('Error loading appointments:', error);
          this.loading.appointments = false;
        }
      );
  }

  // Отключение/включение полей формы
  disableFormFields(disable: boolean): void {
    if (disable) {
      this.filterForm.disable();
    } else {
      if (this.userRole === 'Administrator') {
        // Для админа включаем поля, но с учетом зависимостей
        this.filterForm.enable();
        
        // Избирательное отключение полей
        if (!this.selectedFilters.hospitalId) {
          this.filterForm.get('specialtyId')?.disable();
        }
        
        if (!this.selectedFilters.specialtyId) {
          this.filterForm.get('doctorId')?.disable();
        }
      } else if (this.userRole === 'ChiefDoctor') {
        // Для главврача всегда отключено поле больницы
        this.filterForm.enable();
        this.filterForm.get('hospitalId')?.disable();
        
        if (!this.selectedFilters.specialtyId) {
          this.filterForm.get('doctorId')?.disable();
        }
      } else if (this.userRole === 'Doctor') {
        // Для врача все поля отключены
        this.filterForm.disable();
      }
    }
  }
  
  // Управление отключением полей формы
  disableFormControls(disableHospital: boolean, disableSpecialty: boolean, disableDoctor: boolean): void {
    const hospitalControl = this.filterForm.get('hospitalId');
    const specialtyControl = this.filterForm.get('specialtyId');
    const doctorControl = this.filterForm.get('doctorId');
    
    if (disableHospital) {
      hospitalControl?.disable();
    } else {
      hospitalControl?.enable();
    }
    
    if (disableSpecialty) {
      specialtyControl?.disable();
    } else {
      specialtyControl?.enable();
    }
    
    if (disableDoctor) {
      doctorControl?.disable();
    } else {
      doctorControl?.enable();
    }
  }

  // Подписка на изменения полей формы
  subscribeToFormChanges(): void {
    // Реакция на изменение больницы
    const hospitalSub = this.filterForm.get('hospitalId')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(hospitalId => {
        if (hospitalId && hospitalId !== this.selectedFilters.hospitalId) {
          this.selectedFilters.hospitalId = hospitalId;
          this.selectedFilters.specialtyId = 0;
          this.selectedFilters.doctorId = 0;
          this.filterForm.get('specialtyId')?.setValue(0);
          this.filterForm.get('doctorId')?.setValue(0);
          
          this.specialties = [];
          this.doctors = [];
          
          // Загрузка специальностей для выбранной больницы
          this.loadSpecialties(hospitalId);
        }
      });
    
    if (hospitalSub) this.subscriptions.add(hospitalSub);
    
    // Реакция на изменение специальности
    const specialtySub = this.filterForm.get('specialtyId')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(specialtyId => {
        if (specialtyId && specialtyId !== this.selectedFilters.specialtyId) {
          this.selectedFilters.specialtyId = specialtyId;
          this.selectedFilters.doctorId = 0;
          this.filterForm.get('doctorId')?.setValue(0);
          
          this.doctors = [];
          
          // Загрузка врачей для выбранной больницы и специальности
          this.loadDoctors(this.selectedFilters.hospitalId, specialtyId);
        }
      });
    
    if (specialtySub) this.subscriptions.add(specialtySub);
    
    // Реакция на изменение врача
    const doctorSub = this.filterForm.get('doctorId')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(doctorId => {
        if (doctorId !== this.selectedFilters.doctorId) {
          this.selectedFilters.doctorId = doctorId;
        }
      });
    
    if (doctorSub) this.subscriptions.add(doctorSub);
    
    // Реакция на изменение даты
    const dateSub = this.filterForm.get('dateFrom')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(date => {
        if (date && date !== this.selectedFilters.dateFrom) {
          this.selectedFilters.dateFrom = date;
        }
      });
    
    if (dateSub) this.subscriptions.add(dateSub);

    const dateToSub = this.filterForm.get('dateTo')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(date => {
        if (date && date !== this.selectedFilters.dateTo) {
          this.selectedFilters.dateTo = date;
        }
      });
    
    if (dateToSub) this.subscriptions.add(dateToSub);
  }

  // Применение фильтров и загрузка талонов
  applyFilters(): void {
    // Обновление выбранных фильтров из формы
    const formValues = this.filterForm.getRawValue(); // Получаем значения всех контролов, включая отключенные
    this.selectedFilters = {
      hospitalId: formValues.hospitalId,
      specialtyId: formValues.specialtyId,
      doctorId: formValues.doctorId,
      dateFrom: formValues.dateFrom,
      dateTo: formValues.dateTo
    };
    
    // Загрузка талонов с обновленными фильтрами
    this.loadAppointments();
  }

  // Фильтрация талонов по статусу
  filterByStatus(status: number): void {
    this.statusFilter = status;
    this.loadAppointments();
  }

  // Отмена талона
  cancelAppointment(appointmentId: number): void {
    this.appointmentService.cancelAppointment(appointmentId).subscribe({
      next: () => {
        // Перезагрузка талонов для отображения изменений
        this.loadAppointments();
      },
      error: (error: any) => {
        console.error('Ошибка при отмене талона:', error);
        // Обработка ошибки (например, показ сообщения пользователю)
      }
    });
  }

  // Завершение приема
  completeAppointment(appointmentId: number): void {
    this.appointmentService.completeAppointment(appointmentId).subscribe({
      next: () => {
        // Перезагрузка талонов для отображения изменений
        this.loadAppointments();
      },
      error: (error: any) => {
        console.error('Ошибка при завершении приема:', error);
        // Обработка ошибки (например, показ сообщения пользователю)
      }
    });
  }

  // Форматирование даты для отображения
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // Parse the date string (which should be in YYYY-MM-DD format)
      const [year, month, day] = dateString.split('-').map(Number);
      
      // Create a date object using local timezone
      const date = new Date(year, month - 1, day);
      
      // Format as DD.MM.YYYY
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  // Helper to get today's date in YYYY-MM-DD format
  getTodayDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Получение текстового представления статуса
  getStatusText(status: string): string {
    switch (status.toLowerCase()) {
      case 'waiting':
        return 'Ожидается';
      case 'completed':
        return 'Выполнен';
      case 'cancelled':
        return 'Отменен';
      default:
        return status;
    }
  }

  // Получение класса CSS для статуса
  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'waiting':
        return 'status-waiting';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  }

  // Получение ID статуса по enum
  getStatusIdByEnum(status: number): number {
    switch (status) {
      case AppointmentStatus.Waiting:
        return 4;
      case AppointmentStatus.Completed:
        return 1;
      case AppointmentStatus.Cancelled:
        return 3;
      default:
        return 0;
    }
  }

  // Отключение полей формы для врача (все кроме даты)
  disableFormFieldsForDoctor(): void {
    // Отключаем все поля кроме dateFrom и dateTo
    this.filterForm.get('hospitalId')?.disable();
    this.filterForm.get('specialtyId')?.disable();
    this.filterForm.get('doctorId')?.disable();
    
    // Устанавливаем значения
    this.filterForm.get('hospitalId')?.setValue(this.hospitalId);
    this.filterForm.get('doctorId')?.setValue(this.doctorId);
  }
} 