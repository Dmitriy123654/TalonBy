import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService, ThemeOption, Theme } from '../../core/services/theme.service';
import { AuthService, UserInfo } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { Subscription } from 'rxjs';
import { RoleOfUser } from '../../shared/interfaces/user.interface';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  currentTheme: Theme = 'light-theme';
  isLoggedIn = false;
  userRole: string = 'Patient'; // Default role
  hasAdminAccess = false;
  userInfo: UserInfo | null = null;
  
  // Add static property to track refresh state
  static isRefreshing = false;
  
  private themeSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  private userInfoSubscription: Subscription | null = null;
  private userServiceSubscription: Subscription | null = null;
  
  constructor(
    public themeService: ThemeService,
    private authService: AuthService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    
    // Подписываемся на статус аутентификации
    this.authSubscription = this.authService.authState.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
      
      // If user is logged in, load user info
      if (isAuthenticated) {
        this.loadUserInfo();
      } else {
        // Reset user info when logged out
        this.userRole = 'Patient';
        this.hasAdminAccess = false;
        this.userInfo = null;
      }
    });
    
    // Подписываемся на информацию о пользователе из JWT
    this.userInfoSubscription = this.authService.userInfo.subscribe(userInfo => {
      if (userInfo) {
        this.userInfo = userInfo;
        this.userRole = userInfo.role || 'Patient';
        
        // Используем метод hasAdminAccess из AuthService
        this.hasAdminAccess = this.authService.hasAdminAccess();
      } else {
        // Clear user info when userInfo is null
        this.userRole = 'Patient';
        this.hasAdminAccess = false;
        this.userInfo = null;
      }
    });
  }
  
  loadUserInfo() {
    // Flag to track if we're currently refreshing data
    // Use static property directly
    if (HeaderComponent.isRefreshing) {
      return;
    }
    
    // Update admin access check from authService
    this.hasAdminAccess = this.authService.hasAdminAccess();
    
    // Update user info from authService cache
    this.userInfo = this.authService.getUserInfo();
    if (this.userInfo) {
      this.userRole = this.userInfo.role || 'Patient';
      
      // If we already have valid user info from token, don't refresh unnecessarily
      if (this.userInfo.userId && this.userInfo.email && this.userInfo.role) {
        return;
      }
    }
    
    // Set refreshing flag
    HeaderComponent.isRefreshing = true;
    
    // Only refresh data if needed and not already refreshing
    this.authService.refreshUserData().subscribe({
      next: (updatedUserInfo) => {
        if (updatedUserInfo) {
          // Update UI with new data
          this.userInfo = this.authService.getUserInfo(); // Get from cache instead of response
          if (this.userInfo) {
            this.userRole = this.userInfo.role || 'Patient';
            // Recalculate access
            this.hasAdminAccess = this.authService.hasAdminAccess();
          }
        }
        
        // Reset refreshing flag
        HeaderComponent.isRefreshing = false;
      },
      error: () => {
        // Reset refreshing flag even on error
        HeaderComponent.isRefreshing = false;
      }
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.userInfoSubscription) {
      this.userInfoSubscription.unsubscribe();
    }
    if (this.userServiceSubscription) {
      this.userServiceSubscription.unsubscribe();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
  
  logout() {
    // Выполняем logout и не ждем завершения запроса, т.к. состояние уже меняется в AuthService
    this.authService.logout().subscribe();
  }

  getCurrentThemeIcon(): string {
    const currentTheme = this.themeService.themeOptions.find(
      t => t.id === this.currentTheme
    );
    return currentTheme ? currentTheme.icon : '☀️';
  }

  getNextTheme(): ThemeOption {
    const currentIdx = this.themeService.themeOptions.findIndex(
      t => t.id === this.currentTheme
    );
    const nextIdx = (currentIdx + 1) % this.themeService.themeOptions.length;
    return this.themeService.themeOptions[nextIdx];
  }
}
