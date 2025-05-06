import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { User, RoleOfUser } from '../../../shared/interfaces/user.interface';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class UserManagementComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  
  showUserList: boolean = true;
  showUserDetails: boolean = false;
  
  searchForm: FormGroup;
  
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // User edit form data
  editUserForm: FormGroup;
  isUserFormSubmitted: boolean = false;

  // Password change data
  passwordChange = {
    newPassword: '',
    confirmPassword: ''
  };
  isPasswordFormSubmitted: boolean = false;

  // Доступ к редактированию пользователей
  canEditUsers: boolean = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      searchText: [''],
      filterBy: ['email']
    });
    
    this.editUserForm = this.formBuilder.group({
      email: [''],
      phone: [''],
      role: ['']
    });
    
    // Проверяем права доступа
    this.checkPermissions();
  }

  ngOnInit(): void {
    this.loadUsers();
  }
  
  // Проверка прав доступа для редактирования пользователей
  checkPermissions(): void {
    const userInfo = this.authService.getUserInfo();
    if (userInfo && userInfo.role) {
      this.canEditUsers = [RoleOfUser.Administrator, RoleOfUser.ChiefDoctor].includes(userInfo.role as RoleOfUser);
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = [...users];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.errorMessage = 'Ошибка загрузки пользователей';
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    const searchText = this.searchForm.get('searchText')?.value.toLowerCase();
    const filterBy = this.searchForm.get('filterBy')?.value;
    
    if (!searchText) {
      this.filteredUsers = [...this.users];
      return;
    }
    
    this.filteredUsers = this.users.filter(user => {
      switch (filterBy) {
        case 'email':
          return user.email && user.email.toLowerCase().includes(searchText);
        case 'role':
          return user.role !== undefined && this.getRoleDisplayName(user.role).toLowerCase().includes(searchText);
        case 'phone':
          return user.phone && user.phone.toLowerCase().includes(searchText);
        default:
          return true;
      }
    });
  }

  getRoleDisplayName(role: string | number | undefined): string {
    if (role === undefined || role === null) return '';
    
    // Convert numeric role to string
    if (typeof role === 'number') {
      switch (role) {
        case 0: return 'Пациент';
        case 1: return 'Врач';
        case 2: return 'Главный врач';
        case 3: return 'Администратор';
        case 4: return 'Системный аналитик';
        case 5: return 'Медицинский персонал';
        default: return `Роль ${role}`;
      }
    }
    
    // Handle string roles
    switch (role) {
      case RoleOfUser.Administrator:
        return 'Администратор';
      case RoleOfUser.Doctor:
        return 'Врач';
      case RoleOfUser.Patient:
        return 'Пациент';
      case RoleOfUser.ChiefDoctor:
        return 'Главный врач';
      case RoleOfUser.SystemAnalyst:
        return 'Системный аналитик';
      case RoleOfUser.MedicalStaff:
        return 'Медицинский персонал';
      default:
        return String(role);
    }
  }

  viewUserDetails(user: User): void {
    this.selectedUser = user;
    
    console.log(`Viewing user details for ${user.email}, role: ${user.role}`);
    
    // Format phone for display if needed
    let displayPhone = user.phone || '';
    if (displayPhone && displayPhone.match(/^\+375\d{9}$/)) {
      // Format raw phone to display format
      const phoneDigits = displayPhone.substring(4); // Remove +375
      displayPhone = `+375(${phoneDigits.substring(0,2)})${phoneDigits.substring(2,5)}-${phoneDigits.substring(5,7)}-${phoneDigits.substring(7,9)}`;
    }
    
    // Convert numeric role value to string role name
    let roleValue = user.role;
    if (typeof user.role === 'number') {
      switch (user.role) {
        case 0: roleValue = 'Patient'; break;
        case 1: roleValue = 'Doctor'; break;
        case 2: roleValue = 'ChiefDoctor'; break;
        case 3: roleValue = 'Administrator'; break;
        case 4: roleValue = 'SystemAnalyst'; break;
        case 5: roleValue = 'MedicalStaff'; break;
      }
      console.log(`Converted numeric role ${user.role} to string role "${roleValue}"`);
    }
    
    // Reset forms
    this.editUserForm.patchValue({
      email: user.email || '',
      phone: displayPhone,
      role: roleValue || ''
    });
    
    console.log(`Form values set: role = "${this.editUserForm.get('role')?.value}"`);
    
    this.showUserList = false;
    this.showUserDetails = true;
    
    // Reset form state
    this.isUserFormSubmitted = false;
    this.isPasswordFormSubmitted = false;
    this.passwordChange = {
      newPassword: '',
      confirmPassword: ''
    };
  }

  backToUserList(): void {
    this.showUserList = true;
    this.showUserDetails = false;
    this.selectedUser = null;
  }

  saveUserSettings(): void {
    // Проверяем права доступа перед сохранением
    if (!this.canEditUsers) {
      this.errorMessage = 'У вас нет прав для редактирования пользователей';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.isUserFormSubmitted = true;
    
    if (!this.validateUserForm()) {
      return;
    }
    
    this.isLoading = true;
    
    const settings = {
      email: this.editUserForm.get('email')?.value,
      phone: this.editUserForm.get('phone')?.value,
      role: this.editUserForm.get('role')?.value,
      userId: this.selectedUser?.userId
    };
    
    // Remove formatting characters from phone number
    if (settings.phone) {
      settings.phone = settings.phone.replace(/[\s\(\)\-]/g, '');
    }
    
    this.userService.updateUserByAdmin(settings).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.loadUsers();
          this.successMessage = 'Настройки пользователя успешно сохранены.';
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.errorMessage = 'Ошибка при сохранении настроек. Пожалуйста, попробуйте еще раз.';
          setTimeout(() => this.errorMessage = '', 3000);
          this.isLoading = false;
        }
      },
      error: (error) => {
        console.error('Settings save error:', error);
        this.errorMessage = 'Ошибка при сохранении настроек. Пожалуйста, попробуйте еще раз.';
        setTimeout(() => this.errorMessage = '', 3000);
        this.isLoading = false;
      }
    });
  }

  changeUserPassword(): void {
    // Проверяем права доступа перед изменением пароля
    if (!this.canEditUsers) {
      this.errorMessage = 'У вас нет прав для изменения пароля пользователя';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }
    
    this.isPasswordFormSubmitted = true;
    
    if (!this.validatePasswordForm()) {
      return;
    }
    
    this.isLoading = true;
    
    const passwordData = {
      userId: this.selectedUser?.userId,
      newPassword: this.passwordChange.newPassword
    };
    
    this.userService.resetUserPasswordByAdmin(passwordData).subscribe({
      next: (success: boolean) => {
        if (success) {
          this.successMessage = 'Пароль пользователя успешно изменен.';
          setTimeout(() => this.successMessage = '', 3000);
          
          // Reset password fields
          this.passwordChange = {
            newPassword: '',
            confirmPassword: ''
          };
          this.isPasswordFormSubmitted = false;
        } else {
          this.errorMessage = 'Ошибка при изменении пароля. Пожалуйста, попробуйте еще раз.';
          setTimeout(() => this.errorMessage = '', 3000);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Password change error:', error);
        this.errorMessage = 'Ошибка при изменении пароля. Пожалуйста, попробуйте еще раз.';
        setTimeout(() => this.errorMessage = '', 3000);
        this.isLoading = false;
      }
    });
  }

  validateUserForm(): boolean {
    return !this.emailInvalid && !this.phoneInvalid;
  }
  
  validatePasswordForm(): boolean {
    return !this.newPasswordInvalid && !this.confirmPasswordInvalid;
  }
  
  get emailInvalid(): boolean {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return !emailPattern.test(this.editUserForm.get('email')?.value);
  }
  
  get phoneInvalid(): boolean {
    // Validate phone format +375 (XX) XXX-XX-XX
    const phoneValue = this.editUserForm.get('phone')?.value;
    if (!phoneValue) return false; // Optional
    
    // Updated to be more lenient with formatting
    // As long as it contains the country code and 9 digits
    const cleanPhone = phoneValue.replace(/[\s\(\)\-]/g, '');
    return !cleanPhone.match(/^\+375\d{9}$/);
  }
  
  get newPasswordInvalid(): boolean {
    // Password should have at least 6 chars, one uppercase letter and one digit
    const passwordPattern = /^(?=.*[A-Z])(?=.*[0-9]).{6,}$/;
    return this.passwordChange.newPassword ? !passwordPattern.test(this.passwordChange.newPassword) : false;
  }
  
  get confirmPasswordInvalid(): boolean {
    return this.passwordChange.newPassword !== this.passwordChange.confirmPassword;
  }
} 