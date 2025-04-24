import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminComponent } from './admin.component';
import { ScheduleManagementComponent } from './schedule-management/schedule-management.component';

const routes: Routes = [
  {
    path: '',
    component: AdminComponent
  }
];

@NgModule({
  declarations: [
    AdminComponent,
    ScheduleManagementComponent
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