import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Patient } from '../../shared/interfaces/user.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: string = 'patients';
  showEditForm: boolean = false;
  editingPatient: Patient | null = null;
  isLoading: boolean = true;
  
  // Текущая дата для ограничения выбора даты рождения
  today: string = new Date().toISOString().split('T')[0];
  
  // Настройки пользователя
  userSettings = {
    email: '',
    phone: ''
  };
  
  // Изменение пароля
  passwordChange = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  // Флаги валидации
  isUserFormSubmitted = false;
  isPasswordFormSubmitted = false;
  isPatientFormSubmitted = false;
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        // Если пациенты не существуют, инициализируем пустым массивом
        this.currentUser = {
          ...user,
          patients: user.patients || []
        };
        
        // Инициализация настроек пользователя
        this.userSettings.email = this.currentUser.email;
        this.userSettings.phone = this.currentUser.phone || '';
        this.isLoading = false;
        
        console.log('Loaded user profile:', this.currentUser); // Для отладки
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.isLoading = false;
      }
    });
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
      console.log('Profile deleted');
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
      this.userService.deletePatient(patientId).subscribe({
        next: (success) => {
          if (success) {
            console.log(`Patient with ID ${patientId} deleted successfully`);
            // Загружаем обновленные данные с сервера
            this.loadUserProfile();
          } else {
            console.error(`Failed to delete patient with ID ${patientId}`);
            // Обновляем профиль, чтобы получить актуальные данные с сервера
            this.loadUserProfile();
          }
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
          this.loadUserProfile();
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
          console.log('Patient added successfully:', patient);
          // Загружаем обновленные данные с сервера
          this.loadUserProfile();
          this.setActiveTab('patients');
        },
        error: (error) => {
          console.error('Error adding patient:', error);
          alert('Ошибка при добавлении пациента. Пожалуйста, попробуйте еще раз.');
        }
      });
    } else {
      // Обновление существующего пациента
      const patientData: Partial<Patient> = {
        fullName: this.editingPatient.fullName,
        relationship: this.editingPatient.relationship,
        birthDate: this.editingPatient.birthDate,
        isAdult: this.editingPatient.isAdult,
        address: this.editingPatient.address
      };
      
      this.userService.updatePatient(this.editingPatient.patientId, patientData).subscribe({
        next: (patient) => {
          console.log('Patient updated successfully:', patient);
          // Загружаем обновленные данные с сервера
          this.loadUserProfile();
          this.setActiveTab('patients');
        },
        error: (error) => {
          console.error('Error updating patient:', error);
          alert('Ошибка при обновлении пациента. Пожалуйста, попробуйте еще раз.');
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
  
  // Геттеры для проверки валидности полей пациента
  get patientFullNameInvalid(): boolean {
    return !this.editingPatient?.fullName;
  }
  
  get patientRelationshipInvalid(): boolean {
    return !this.editingPatient?.relationship;
  }
  
  get patientBirthDateInvalid(): boolean {
    if (!this.editingPatient?.birthDate) return true;
    
    // Проверка, что дата рождения не в будущем
    const birthDate = new Date(this.editingPatient.birthDate);
    const today = new Date();
    return birthDate > today;
  }
  
  // Сохранение настроек пользователя
  saveUserSettings(): void {
    this.isUserFormSubmitted = true;
    
    // Валидация
    if (!this.validateUserForm()) {
      return;
    }
    
    if (this.currentUser) {
      // Обновляем только email и телефон
      const updatedUser: Partial<User> = {
        email: this.userSettings.email,
        phone: this.userSettings.phone
      };
      
      this.userService.updateUserProfile(updatedUser).subscribe({
        next: (updatedUser) => {
          console.log('User settings updated successfully:', updatedUser);
          this.currentUser = updatedUser;
          alert('Настройки успешно сохранены');
          this.isUserFormSubmitted = false;
        },
        error: (error) => {
          console.error('Error updating user settings:', error);
          alert('Ошибка при сохранении настроек. Пожалуйста, попробуйте еще раз.');
        }
      });
    }
  }
  
  // Изменение пароля
  changePassword(): void {
    this.isPasswordFormSubmitted = true;
    
    // Валидация
    if (!this.validatePasswordForm()) {
      return;
    }
    
    this.userService.changePassword(
      this.passwordChange.currentPassword,
      this.passwordChange.newPassword
    ).subscribe({
      next: () => {
        alert('Пароль успешно изменен');
        
        // Сбрасываем поля формы
        this.passwordChange = {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        this.isPasswordFormSubmitted = false;
      },
      error: (error) => {
        console.error('Error changing password:', error);
        alert('Ошибка при изменении пароля. Пожалуйста, проверьте текущий пароль и попробуйте еще раз.');
      }
    });
  }
  
  // Валидация формы пользователя
  validateUserForm(): boolean {
    return !this.emailInvalid && !this.phoneInvalid;
  }
  
  // Валидация формы пароля
  validatePasswordForm(): boolean {
    return !this.currentPasswordInvalid && 
           !this.newPasswordInvalid && 
           !this.confirmPasswordInvalid;
  }
  
  // Геттеры для проверки валидности полей пользователя
  get emailInvalid(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !this.userSettings.email || !emailRegex.test(this.userSettings.email);
  }
  
  get phoneInvalid(): boolean {
    // Обновленная валидация телефона как при регистрации
    if (!this.userSettings.phone) return true;
    
    // Проверяем длину с учетом формата +375(XX)XXX-XX-XX
    // Должно быть 17 символов в полном номере
    return this.userSettings.phone.length < 17; 
  }
  
  // Геттеры для проверки валидности полей пароля
  get currentPasswordInvalid(): boolean {
    return !this.passwordChange.currentPassword;
  }
  
  get newPasswordInvalid(): boolean {
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9]).*$/;
    return !this.passwordChange.newPassword || 
           this.passwordChange.newPassword.length < 6 ||
           !passwordRegex.test(this.passwordChange.newPassword);
  }
  
  get confirmPasswordInvalid(): boolean {
    return !this.passwordChange.confirmPassword || 
           this.passwordChange.newPassword !== this.passwordChange.confirmPassword;
  }
  
  getRemainingPatientsSlots(): number[] {
    if (!this.currentUser || !this.currentUser.patients) {
      return Array(6).fill(0).map((x, i) => i);
    }
    
    const remainingSlots = 6 - this.currentUser.patients.length;
    return remainingSlots > 0 ? Array(remainingSlots).fill(0).map((x, i) => i) : [];
  }

  logout(): void {
    if (confirm('Вы уверены, что хотите выйти?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/']);
        },
        error: (error) => {
          console.error('Error during logout:', error);
          // Navigate anyway, even if there was an error
          this.router.navigate(['/']);
        }
      });
    }
  }
} 