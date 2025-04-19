import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light-theme' | 'dark-theme' | 'blue-theme' | 'violet-theme';

export interface ThemeOption {
  id: Theme;
  name: string;
  icon: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  themeOptions: ThemeOption[] = [
    { id: 'light-theme', name: 'Светлая', icon: '☀️' },
    { id: 'dark-theme', name: 'Темная', icon: '🌙' },
    { id: 'blue-theme', name: 'Синяя', icon: '🌊' },
    { id: 'violet-theme', name: 'Фиолетовая', icon: '🔮' }
  ];
  
  private currentThemeSubject = new BehaviorSubject<Theme>(this.getStoredTheme());
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.applyTheme(this.currentThemeSubject.value);
  }

  toggleTheme(): void {
    const currentIdx = this.themeOptions.findIndex(t => t.id === this.currentThemeSubject.value);
    const nextIdx = (currentIdx + 1) % this.themeOptions.length;
    this.setTheme(this.themeOptions[nextIdx].id);
  }

  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    localStorage.setItem('theme', theme);
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.className = theme;
  }

  private getStoredTheme(): Theme {
    const storedTheme = localStorage.getItem('theme') as Theme;
    return storedTheme && this.themeOptions.some(t => t.id === storedTheme) 
      ? storedTheme 
      : 'light-theme';
  }
} 