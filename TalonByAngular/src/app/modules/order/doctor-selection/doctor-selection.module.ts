import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DoctorSelectionComponent } from './doctor-selection.component';

const routes: Routes = [
  {
    path: '',
    component: DoctorSelectionComponent
  }
];

@NgModule({
  declarations: [DoctorSelectionComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ]
})
export class DoctorSelectionModule { }
