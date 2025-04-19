import { ApplicationConfig } from '@angular/core';
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
import { importProvidersFrom } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    importProvidersFrom(CoreModule, SharedModule),
    provideNgxMask()
  ],
};
