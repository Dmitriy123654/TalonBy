import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminComponent } from './admin.component';
import { ScheduleManagementComponent } from './schedule-management/schedule-management.component';
import { AppointmentsManagementComponent } from './appointments-management/appointments-management.component';
import { PatientManagementComponent } from './patient-management/patient-management.component';
import { UserManagementComponent } from './user-management/user-management.component';
import { DoctorManagementComponent } from './doctor-management/doctor-management.component';
import { HospitalManagementComponent } from './hospital-management/hospital-management.component';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent
  }
];

@NgModule({
  declarations: [
    AdminComponent,
    ScheduleManagementComponent,
    AppointmentsManagementComponent,
    PatientManagementComponent,
    UserManagementComponent,
    DoctorManagementComponent,
    HospitalManagementComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective
  ],
  providers: [
    provideNgxMask()
  ],
  exports: [
    AdminComponent
  ]
})
export class AdminModule { } 