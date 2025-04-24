import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { AuthService, UserInfo } from '../../core/services/auth.service';
import { User, RoleOfUser } from '../../shared/interfaces/user.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  currentUser: User | null = null;
  userInfo: UserInfo | null = null;
  activeTab: string = 'appointments';
  isLoading: boolean = true;
  userRole: string = 'Patient'; // Default role
  
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Обновляем информацию о пользователе с сервера
    this.authService.getCurrentUser().subscribe({
      next: () => {
        // После обновления информации проверяем права доступа
        this.checkAdminAccess();
      },
      error: () => this.checkAdminAccess() // Всё равно проверяем доступ, используя кэшированные данные
    });
  }

  // Проверка доступа к админке
  checkAdminAccess(): void {
    // Получаем информацию из JWT/localStorage
    this.userInfo = this.authService.getUserInfo();
    
    if (this.userInfo) {
      console.log('Информация о пользователе из AuthService:', this.userInfo);
      this.userRole = this.userInfo.role || 'Patient';
      
      // Используем новый метод hasAdminAccess вместо проверки только на Administrator
      if (!this.authService.hasAdminAccess()) {
        console.log('Пользователь с ролью', this.userRole, 'не имеет доступа к админ-странице, перенаправляем');
        this.router.navigate(['/main']);
        return;
      }
    } else {
      console.log('Нет информации о пользователе в AuthService, перенаправляем на главную');
      this.router.navigate(['/main']);
      return;
    }
    
    // Затем загружаем полные данные пользователя из API
    this.loadUserProfile();
    console.log('AdminComponent initialized, loading profile data');
  }

  loadUserProfile(): void {
    this.isLoading = true;
    console.log('Starting to load user profile');
    
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        console.log('User profile loaded successfully:', user);
        console.log('User role from backend:', user.role);
        this.currentUser = user;
        
        // Еще раз проверяем роль после получения данных с сервера
        this.userRole = user.role || this.userInfo?.role || 'Patient';
        console.log('Final user role:', this.userRole);
        
        // Используем новый метод hasAdminAccess вместо проверки только на Administrator
        if (!this.authService.hasAdminAccess()) {
          console.log('User does not have admin access, redirecting');
          this.router.navigate(['/main']);
          return;
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        this.isLoading = false;
        
        // Если у нас есть информация из JWT
        if (this.userInfo) {
          console.log('Using minimal user object from JWT');
          this.currentUser = {
            userId: parseInt(this.userInfo.userId.toString(), 10),
            email: this.userInfo.email,
            fullName: 'Пользователь',
            role: this.userInfo.role
          };
          
          // Снова используем метод hasAdminAccess
          if (!this.authService.hasAdminAccess()) {
            console.log('User does not have admin access (JWT), redirecting');
            this.router.navigate(['/main']);
          }
        } 
        // Если нет никакой информации, перенаправляем
        else {
          console.log('No user info, redirecting to main page');
          this.router.navigate(['/main']);
        }
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    console.log('Set active tab to:', tab);
  }
  
  // Check if a tab should be visible based on user role
  isTabVisible(tabName: string): boolean {
    // Для админа показываем все разделы
    if (this.userRole === 'Administrator' || this.userRole === 'ChiefDoctor') {
      return true;
    }
    
    // Для других ролей проверяем по конкретным доступам
    switch(tabName) {
      case 'appointments':
        return ['Doctor', 'ChiefDoctor', 'MedicalStaff', 'SystemAnalyst', 'Administrator'].includes(this.userRole);
      case 'schedule':
        return ['Doctor', 'ChiefDoctor', 'MedicalStaff', 'SystemAnalyst', 'Administrator'].includes(this.userRole);
      case 'personalData':
        return ['Doctor', 'ChiefDoctor', 'MedicalStaff', 'SystemAnalyst', 'Administrator'].includes(this.userRole);
      default:
        return false;
    }
  }
} 