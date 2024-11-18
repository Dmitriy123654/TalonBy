import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { RegisterComponent } from './modules/register/register.component';
import { MainPageComponent } from './modules/main-page/main-page.component';
import { TalonsComponent } from './modules/talons/talons.component';
import { HospitalsComponent } from './modules/hospitals/hospitals.component';
import { HistoryOfPacientComponent } from './modules/history-of-pacient/history-of-pacient.component';
import { ProfileComponent } from './modules/profile/profile.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'main', component: MainPageComponent },
  { path: 'talons', component: TalonsComponent },
  { path: 'hospitals', component: HospitalsComponent },
  { path: 'history', component: HistoryOfPacientComponent },
  { path: 'profile', component: ProfileComponent },
  { path: '', redirectTo: '/register', pathMatch: 'full' },
];
