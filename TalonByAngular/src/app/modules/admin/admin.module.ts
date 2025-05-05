import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminComponent } from './admin.component';
import { ScheduleManagementComponent } from './schedule-management/schedule-management.component';
import { AppointmentsManagementComponent } from './appointments-management/appointments-management.component';
import { PatientManagementComponent } from './patient-management/patient-management.component';

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
    PatientManagementComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    AdminComponent
  ]
})
export class AdminModule { } 