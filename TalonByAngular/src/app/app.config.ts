import { ApplicationConfig, importProvidersFrom, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
// import { provideClientHydration } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { HeaderComponent } from './modules/header/header.component';
import { routes } from './app.routes';
import { provideNgxMask } from 'ngx-mask';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { AuthService } from './core/services/auth.service';

// Create an initializer function that checks auth state on app startup
export function initializeAuth(authService: AuthService) {
  return () => {
    // Return the persisted auth state immediately for fast initial load
    const persistedAuth = localStorage.getItem('auth_state');
    if (persistedAuth === 'true') {
      return Promise.resolve(true);
    }
    
    // Then verify with server in the background
    authService.getCurrentUser().subscribe();
    return Promise.resolve(true);
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    importProvidersFrom(CoreModule, SharedModule),
    provideNgxMask(),
    // Add APP_INITIALIZER to check auth state during app bootstrap
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true
    }
  ],
};
