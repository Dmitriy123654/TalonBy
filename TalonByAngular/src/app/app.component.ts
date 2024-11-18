import { Component } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';

import { RegisterComponent } from './modules/register/register.component';
import { LoginComponent } from './modules/login/login.component';
import { HttpClientModule } from '@angular/common/http';
import { filter } from 'rxjs';
import { HeaderComponent } from './modules/header/header.component';
import { CommonModule } from '@angular/common';
import { HistoryOfPacientComponent } from './modules/history-of-pacient/history-of-pacient.component';
import { HospitalsComponent } from './modules/hospitals/hospitals.component';
import { TalonsComponent } from './modules/talons/talons.component';
import { ProfileComponent } from './modules/profile/profile.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HttpClientModule,
    RouterOutlet,
    RegisterComponent,
    LoginComponent,
    HeaderComponent,
    CommonModule,
    HistoryOfPacientComponent,
    HospitalsComponent,
    TalonsComponent,
    ProfileComponent,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'TalonByAngular';
  private readonly excludedRoutes = ['/login', '/register'];

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        // Дополнительная логика, если необходимо
      });
  }

  isLoginOrRegisterPage(): boolean {
    return this.excludedRoutes.includes(this.router.url);
  }
}
// import { Component } from '@angular/core';
// @Component({
//   selector: 'app-root',
//   standalone: true,
//   templateUrl: './app.component.html',
//   styleUrls: ['./app.component.scss'],
// })
// export class AppComponent {
//   title = 'TalonByAngular';
// }
