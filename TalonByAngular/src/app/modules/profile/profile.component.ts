import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { AuthService, UserInfo } from '../../core/services/auth.service';
import { User, Patient } from '../../shared/interfaces/user.interface';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MedicalAppointmentDTO, AppointmentStatus } from '../../shared/interfaces/medical-appointment.interface';
import { formatDate } from '@angular/common';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  userInfo: UserInfo | null = null;
  activeTab: string = 'patients';
  showEditForm: boolean = false;
  editingPatient: Patient | null = null;
  isLoading: boolean = true;
  hasAdminAccess: boolean = false;
  
  // Appointments tab
  appointments: MedicalAppointmentDTO[] = [];
  isLoadingAppointments: boolean = false;
  appointmentFilterStatus: number = AppointmentStatus.All;
  dateFrom: string = '';
  dateTo: string = '';
  AppointmentStatus = AppointmentStatus; // Expose enum to template
  
  // Создаем Subscription для управления подписками
  private subscriptions = new Subscription();
  
  // Текущая дата для ограничения выбора даты рождения
  today: string = new Date().toISOString().split('T')[0];
  
  // Настройки пользователя для формы
  userSettings = {
    email: '',
    phone: '',
    fullName: ''
  };
  
  // Поля для смены пароля
  passwordChange = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // Флаги для валидации форм
  isUserFormSubmitted = false;
  isPasswordFormSubmitted = false;
  isPatientFormSubmitted = false;
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Проверяем административный доступ на основе JWT
    this.hasAdminAccess = this.authService.hasAdminAccess();
    
    // Сначала проверяем, есть ли информация в JWT/localStorage
    this.userInfo = this.authService.getUserInfo();
    
    if (this.userInfo) {
      // Инициализация настроек пользователя из JWT
      this.userSettings.email = this.userInfo.email;
      this.userSettings.phone = this.userInfo.phone || '';
    }
    
    // Check if URL has parameters for tab activation
    const url = this.router.url;
    const tabParam = url.includes('?tab=appointments');
    
    if (tabParam) {
      this.setActiveTab('appointments');
    }
    
    // Проверяем, есть ли уже данные пользователя в userService
    const userSub = this.userService.currentUser.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userSettings.email = user.email;
        this.userSettings.phone = user.phone || '';
        this.isLoading = false;
        
        // If we're on the appointments tab, load appointments now that we have user data
        if (this.activeTab === 'appointments') {
          this.loadAppointments();
        }
      } else {
        // Загружаем полный профиль с сервера, если данных нет
        this.loadUserProfile();
      }
    });
    
    this.subscriptions.add(userSub);
  }
  
  ngOnDestroy(): void {
    // Отписываемся от всех подписок при уничтожении компонента
    this.subscriptions.unsubscribe();
  }

  loadUserProfile(forceRefresh: boolean = false): void {
    this.isLoading = true;
    const profileSub = this.userService.getUserProfile(forceRefresh).subscribe({
      next: (user) => {
        this.currentUser = user;
        
        // Обновляем настройки пользователя из профиля
        this.userSettings.email = this.currentUser.email;
        this.userSettings.phone = this.currentUser.phone || '';
        
        // Обновляем информацию о пользователе из AuthService
        this.userInfo = this.authService.getUserInfo();
        
        // Обновляем статус административного доступа
        this.hasAdminAccess = this.authService.hasAdminAccess();
        
        this.isLoading = false;
      },
      error: () => {
        // Если есть информация из JWT, используем её для минимального отображения
        this.userInfo = this.authService.getUserInfo();
        if (this.userInfo) {
          this.currentUser = {
            userId: parseInt(this.userInfo.userId.toString()),
            email: this.userInfo.email,
            fullName: '',
            role: this.userInfo.role,
            phone: this.userInfo.phone,
            patients: []
          };
          
          // Обновляем настройки пользователя из JWT
          this.userSettings.email = this.userInfo.email;
          this.userSettings.phone = this.userInfo.phone || '';
        }
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(profileSub);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    // Сбрасываем состояние форм при смене вкладки
    this.isUserFormSubmitted = false;
    this.isPasswordFormSubmitted = false;
    this.isPatientFormSubmitted = false;
    
    // Если выходим из редактирования пациента, сбрасываем текущего редактируемого пациента
    if (tab !== 'editPatient') {
      this.editingPatient = null;
    }
    
    // If switching to appointments tab, load appointments
    if (tab === 'appointments') {
      this.loadAppointments();
    }
  }

  // Load appointments with current filters
  loadAppointments(): void {
    this.isLoadingAppointments = true;
    
    const filterParams: any = {};
    
    // Only add the status filter if it's not "All"
    if (this.appointmentFilterStatus !== AppointmentStatus.All) {
      filterParams.ReceptionStatusId = this.appointmentFilterStatus;
    }
    
    // Add date filters if provided
    if (this.dateFrom) {
      filterParams.DateFrom = this.dateFrom;
    }
    
    if (this.dateTo) {
      filterParams.DateTo = this.dateTo;
    }
    
    // Add the PatientId filter to only get appointments for the current user's patients
    if (this.currentUser && this.currentUser.patients && this.currentUser.patients.length > 0) {
      // Get all patient IDs of the current user
      const patientIds = this.currentUser.patients.map(p => p.patientId);
      
      // If user has multiple patients, we'll need to make multiple requests
      // and combine the results (or implement a backend endpoint that accepts multiple patient IDs)
      
      // For simplicity here, we'll just load appointments for all patients
      // In a real-world scenario, you might want to add a PatientIds array parameter to the API
      
      const appointmentsSub = this.userService.getUserAppointments(filterParams).subscribe({
        next: (appointments) => {
          // Filter appointments for user's patients only
          this.appointments = appointments.filter(a => 
            patientIds.some(id => a.patientName.includes(this.getPatientNameById(id)))
          );
          this.isLoadingAppointments = false;
        },
        error: (error) => {
          console.error('Error loading appointments:', error);
          this.appointments = [];
          this.isLoadingAppointments = false;
        }
      });
      
      this.subscriptions.add(appointmentsSub);
    } else {
      this.appointments = [];
      this.isLoadingAppointments = false;
    }
  }
  
  // Helper method to get patient name by ID
  getPatientNameById(patientId: number): string {
    if (!this.currentUser || !this.currentUser.patients) return '';
    
    const patient = this.currentUser.patients.find(p => p.patientId === patientId);
    return patient ? patient.fullName : '';
  }
  
  // Filter appointments by status
  filterByStatus(status: number): void {
    this.appointmentFilterStatus = status;
    this.loadAppointments();
  }
  
  // Apply date filter
  applyDateFilter(): void {
    this.loadAppointments();
  }
  
  // Reset date filters
  resetDateFilter(): void {
    this.dateFrom = '';
    this.dateTo = '';
    this.loadAppointments();
  }
  
  // Format appointment date for display
  formatAppointmentDate(date: string): string {
    return formatDate(date, 'dd.MM.yyyy', 'en-US');
  }
  
  // Get appropriate status class for styling
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
  
  // Перевод статуса на русский язык
  getStatusTranslation(status: string): string {
    switch (status.toLowerCase()) {
      case 'waiting':
        return 'Ожидается';
      case 'completed':
        return 'Выполнен';
      case 'cancelled':
        return 'Отменён';
      default:
        return status;
    }
  }

  editProfile(): void {
    this.showEditForm = true;
  }

  deleteProfile(): void {
    if (confirm('Вы уверены, что хотите удалить профиль?')) {
      // Call API to delete profile
    }
  }

  // Редактирование пациента
  editPatient(patientId: number): void {
    if (!this.currentUser || !this.currentUser.patients) return;
    
    const patient = this.currentUser.patients.find(p => p.patientId === patientId);
    if (patient) {
      // Создаем копию пациента для редактирования, чтобы не изменять оригинальные данные
      this.editingPatient = { ...patient };
      this.setActiveTab('editPatient');
    }
  }

  deletePatient(patientId: number): void {
    if (confirm('Вы уверены, что хотите удалить этого пациента?')) {
      // Показываем индикатор загрузки
      this.isLoading = true;
      
      this.userService.deletePatient(patientId).subscribe({
        next: (success) => {
          if (success) {
            // Загружаем обновленные данные с сервера
            this.loadUserProfile(true);
          } else {
            // Обновляем профиль, чтобы получить актуальные данные с сервера
            this.loadUserProfile(true);
          }
        },
        error: () => {
          this.loadUserProfile(true);
          this.isLoading = false;
        }
      });
    }
  }

  addAdultPatient(): void {
    if (this.currentUser && this.currentUser.patients && this.currentUser.patients.length < 6) {
      // Создаем новый объект пациента с дефолтными значениями
      this.editingPatient = {
        patientId: 0, // Будет заполнено сервером
        fullName: '',
        relationship: '', // Значение для пола будет выбрано пользователем
        birthDate: new Date().toISOString().slice(0, 10), // Сегодняшняя дата в формате YYYY-MM-DD
        isAdult: true,
        address: ''
      };
      this.setActiveTab('editPatient');
    } else {
      alert('Достигнуто максимальное количество пациентов (6)');
    }
  }
  
  // Сохранение пациента (нового или редактируемого)
  savePatient(): void {
    this.isPatientFormSubmitted = true;
    
    if (!this.editingPatient) return;
    
    // Валидация
    if (!this.validatePatientForm()) {
      return;
    }
    
    // Показываем индикатор загрузки
    this.isLoading = true;
    
    if (this.editingPatient.patientId === 0) {
      // Добавление нового пациента
      const newPatient: Omit<Patient, 'patientId'> = {
        fullName: this.editingPatient.fullName,
        relationship: this.editingPatient.relationship,
        birthDate: this.editingPatient.birthDate,
        isAdult: this.editingPatient.isAdult,
        address: this.editingPatient.address || ''
      };
      
      this.userService.addPatient(newPatient).subscribe({
        next: (patient) => {
          // Загружаем обновленные данные с сервера
          this.loadUserProfile(true);
          this.setActiveTab('patients');
        },
        error: () => {
          alert('Ошибка при добавлении пациента. Пожалуйста, попробуйте еще раз.');
          this.isLoading = false;
        }
      });
    } else {
      // Обновление существующего пациента
      this.userService.updatePatient(this.editingPatient.patientId, this.editingPatient).subscribe({
        next: (patient) => {
          // Загружаем обновленные данные с сервера
          this.loadUserProfile(true);
          this.setActiveTab('patients');
        },
        error: () => {
          alert('Ошибка при обновлении пациента. Пожалуйста, попробуйте еще раз.');
          this.isLoading = false;
        }
      });
    }
  }
  
  validatePatientForm(): boolean {
    return !this.patientFullNameInvalid && !this.patientRelationshipInvalid && !this.patientBirthDateInvalid;
  }
  
  get patientFullNameInvalid(): boolean {
    return !this.editingPatient?.fullName;
  }
  
  get patientRelationshipInvalid(): boolean {
    return !this.editingPatient?.relationship;
  }
  
  get patientBirthDateInvalid(): boolean {
    if (!this.editingPatient?.birthDate) return true;
    
    const birthDate = new Date(this.editingPatient.birthDate);
    const today = new Date();
    return birthDate > today;
  }
  
  saveUserSettings(): void {
    this.isUserFormSubmitted = true;
    
    if (!this.validateUserForm()) {
      return;
    }
    
      this.isLoading = true;
      
    const settings = {
        email: this.userSettings.email,
        phone: this.userSettings.phone
      };
      
    const settingsSub = this.userService.updateUserSettings(settings).subscribe({
      next: (success: boolean) => {
        if (success) {
          // Обновляем данные пользователя
          this.loadUserProfile(true);
          alert('Настройки успешно сохранены.');
        } else {
          alert('Ошибка при сохранении настроек. Пожалуйста, попробуйте еще раз.');
              this.isLoading = false;
        }
        },
      error: () => {
        alert('Ошибка при сохранении настроек. Пожалуйста, попробуйте еще раз.');
          this.isLoading = false;
        }
      });
    
    this.subscriptions.add(settingsSub);
  }
  
  changePassword(): void {
    this.isPasswordFormSubmitted = true;
    
    if (!this.validatePasswordForm()) {
      return;
    }
    
    if (this.passwordChange.newPassword !== this.passwordChange.confirmPassword) {
      return;
    }
    
    this.isLoading = true;
    
    this.userService.changePassword(
      this.passwordChange.currentPassword,
      this.passwordChange.newPassword
    ).subscribe({
      next: () => {
        // Очищаем форму после успешной смены пароля
        this.passwordChange = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        
        this.isLoading = false;
        this.isPasswordFormSubmitted = false;
        
        // Показываем сообщение об успешной смене пароля
        alert('Пароль успешно изменен!');
      },
      error: (error) => {
        this.isLoading = false;
        
        let errorMessage = 'Ошибка при смене пароля';
        
        if (error?.error?.message) {
          errorMessage = error.error.message;
        }
        
        alert(errorMessage);
      }
    });
  }
  
  validateUserForm(): boolean {
    return !this.emailInvalid && !this.phoneInvalid;
  }
  
  validatePasswordForm(): boolean {
    return !this.currentPasswordInvalid && !this.newPasswordInvalid && !this.confirmPasswordInvalid;
  }
  
  get emailInvalid(): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !emailPattern.test(this.userSettings.email);
  }
  
  get phoneInvalid(): boolean {
    // Простая проверка телефона (может потребоваться более сложная логика)
    return this.userSettings.phone.length < 10; 
  }
  
  get currentPasswordInvalid(): boolean {
    return !this.passwordChange.currentPassword;
  }
  
  get newPasswordInvalid(): boolean {
    // Минимум 6 символов, одна заглавная буква и одна цифра
    const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9]).*$/;
    return this.passwordChange.newPassword.length < 6 || !passwordPattern.test(this.passwordChange.newPassword);
  }
  
  get confirmPasswordInvalid(): boolean {
    return this.passwordChange.confirmPassword !== this.passwordChange.newPassword;
  }
  
  // Helper for grid layout with adding patient buttons
  getRemainingPatientsSlots(): number[] {
    const currentCount = this.currentUser?.patients?.length || 0;
    const maxPatients = 6;
    const remaining = maxPatients - currentCount;
    
    return Array(remaining).fill(0).map((_, i) => i);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 