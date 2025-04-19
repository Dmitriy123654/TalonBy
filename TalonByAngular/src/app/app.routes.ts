import { Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { MainPageComponent } from './modules/main-page/main-page.component';
import { PaidServicesComponent } from './modules/paid-services/paid-services.component';
import { MedicalInstitutionsComponent } from './modules/medical-institutions/medical-institutions.component';
import { AnalysesComponent } from './modules/analyses/analyses.component';
import { MedicinesComponent } from './modules/medicines/medicines.component';
import { BlogComponent } from './modules/blog/blog.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'main', component: MainPageComponent },
  { 
    path: 'order', 
    loadChildren: () => import('./modules/order/order.module').then(m => m.OrderModule),
    canActivate: [authGuard]
  },
  { 
    path: 'paid-services', 
    component: PaidServicesComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'medical-institutions', 
    component: MedicalInstitutionsComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'analyses', 
    component: AnalysesComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'medicines', 
    component: MedicinesComponent,
    canActivate: [authGuard]
  },
  { 
    path: 'blog', 
    component: BlogComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: '/main' }
];
