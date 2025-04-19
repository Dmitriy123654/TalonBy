import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ThemeService, ThemeOption, Theme } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';
import { Subscription } from 'rxjs';

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
  private themeSubscription: Subscription | null = null;
  private authSubscription: Subscription | null = null;
  
  constructor(
    public themeService: ThemeService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.themeSubscription = this.themeService.currentTheme$.subscribe(theme => {
      this.currentTheme = theme;
    });
    
    this.authSubscription = this.authService.authState.subscribe(isAuthenticated => {
      this.isLoggedIn = isAuthenticated;
    });
  }

  ngOnDestroy() {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  toggleTheme() {
    this.themeService.toggleTheme();
  }
  
  logout() {
    this.authService.logout().subscribe(() => {
      // Handle successful logout
    });
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
