import { Component, OnInit, OnDestroy } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { AuthService, UserInfo } from '../../core/services/auth.service';
import { User, Patient } from '../../shared/interfaces/user.interface';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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
    
    // Проверяем, есть ли уже данные пользователя в userService
    const userSub = this.userService.currentUser.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.userSettings.email = user.email;
        this.userSettings.phone = user.phone || '';
        this.isLoading = false;
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

  // Валидация формы пациента
  validatePatientForm(): boolean {
    return !this.patientFullNameInvalid && 
           !this.patientRelationshipInvalid && 
           !this.patientBirthDateInvalid;
  }
  
  get patientFullNameInvalid(): boolean {
    return !this.editingPatient?.fullName || this.editingPatient.fullName.trim().length < 3;
  }
  
  get patientRelationshipInvalid(): boolean {
    return !this.editingPatient?.relationship;
  }
  
  get patientBirthDateInvalid(): boolean {
    if (!this.editingPatient?.birthDate) return true;
    
    try {
      const birthDate = new Date(this.editingPatient.birthDate);
      const today = new Date();
      return isNaN(birthDate.getTime()) || birthDate > today;
    } catch (e) {
      return true;
    }
  }
  
  // Сохранение пользовательских настроек
  saveUserSettings(): void {
    this.isUserFormSubmitted = true;
    
    if (!this.validateUserForm()) {
      return;
    }
    
    // Показываем индикатор загрузки
    this.isLoading = true;
    
    const updatedUserData = {
      email: this.userSettings.email,
      phone: this.userSettings.phone
    };
    
    this.userService.updateUserProfile(updatedUserData).subscribe({
      next: (user) => {
        this.currentUser = user;
        
        // Обновляем информацию о пользователе в сервисе и в компоненте
        this.userInfo = this.authService.getUserInfo();
        
        this.userSettings.email = user.email;
        this.userSettings.phone = user.phone || '';
        
        this.isLoading = false;
        this.isUserFormSubmitted = false;
        
        // Показываем сообщение об успешном обновлении
        alert('Настройки успешно обновлены!');
      },
      error: () => {
        this.isLoading = false;
        alert('Ошибка при обновлении настроек. Пожалуйста, попробуйте еще раз.');
      }
    });
  }
  
  // Смена пароля
  changePassword(): void {
    this.isPasswordFormSubmitted = true;
    
    if (!this.validatePasswordForm()) {
      return;
    }
    
    // Показываем индикатор загрузки
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
  
  // Валидация формы настроек пользователя
  validateUserForm(): boolean {
    return !this.emailInvalid && !this.phoneInvalid;
  }
  
  // Валидация формы смены пароля
  validatePasswordForm(): boolean {
    return !this.currentPasswordInvalid && 
           !this.newPasswordInvalid && 
           !this.confirmPasswordInvalid;
  }
  
  // Геттеры для валидации полей
  get emailInvalid(): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !this.userSettings.email || !emailPattern.test(this.userSettings.email);
  }
  
  get phoneInvalid(): boolean {
    // Упрощенная валидация для телефона - должен начинаться с +375 и содержать 9 цифр после
    // Полная валидация должна учитывать формат +375 (XX) XXX-XX-XX
    const phonePattern = /^\+375\(\d{2}\)\d{3}-\d{2}-\d{2}$/;
    return !this.userSettings.phone || !phonePattern.test(this.userSettings.phone);
  }
  
  get currentPasswordInvalid(): boolean {
    return !this.passwordChange.currentPassword;
  }
  
  get newPasswordInvalid(): boolean {
    // Пароль должен содержать минимум 6 символов, хотя бы одну заглавную букву и цифру
    const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9]).*$/;
    return !this.passwordChange.newPassword || 
           this.passwordChange.newPassword.length < 6 || 
           !passwordPattern.test(this.passwordChange.newPassword);
  }
  
  get confirmPasswordInvalid(): boolean {
    return !this.passwordChange.confirmPassword || 
           this.passwordChange.newPassword !== this.passwordChange.confirmPassword;
  }
  
  // Вспомогательный метод для управления добавлением пациентов
  getRemainingPatientsSlots(): number[] {
    const currentCount = this.currentUser?.patients?.length || 0;
    const maxPatients = 6;
    const remainingSlots = Math.max(0, maxPatients - currentCount);
    
    // Возвращаем массив индексов для добавления новых пациентов
    return Array(remainingSlots).fill(0).map((_, i) => i);
  }
  
  // Выход из системы
  logout(): void {
    this.authService.logout().subscribe();
  }
} 