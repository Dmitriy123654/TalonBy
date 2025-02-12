import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { RegisterComponent } from './modules/register/register.component';
import { MainPageComponent } from './modules/main-page/main-page.component';
import { AppointmentsComponent } from './modules/appointments/appointments.component';
import { PaidServicesComponent } from './modules/paid-services/paid-services.component';
import { MedicalInstitutionsComponent } from './modules/medical-institutions/medical-institutions.component';
import { AnalysesComponent } from './modules/analyses/analyses.component';
import { MedicinesComponent } from './modules/medicines/medicines.component';
import { BlogComponent } from './modules/blog/blog.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'main', component: MainPageComponent },

  { path: 'appointments', component: AppointmentsComponent },
  { path: 'paid-services', component: PaidServicesComponent },
  { path: 'medical-institutions', component: MedicalInstitutionsComponent },
  { path: 'analyses', component: AnalysesComponent },
  { path: 'medicines', component: MedicinesComponent },
  { path: 'blog', component: BlogComponent },
  { path: '', redirectTo: '/main', pathMatch: 'full' },
];
