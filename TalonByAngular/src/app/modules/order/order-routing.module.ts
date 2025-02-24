import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderComponent } from './order.component';

const routes: Routes = [
  { 
    path: '', 
    component: OrderComponent 
  },
  { 
    path: 'speciality', 
    loadChildren: () => import('./speciality-selection/speciality-selection.module')
      .then(m => m.SpecialitySelectionModule)
  },
  { 
    path: 'doctor', 
    loadChildren: () => import('./doctor-selection/doctor-selection.module')
      .then(m => m.DoctorSelectionModule)
  },
  { 
    path: 'datetime', 
    loadChildren: () => import('./datetime-selection/datetime-selection.module')
      .then(m => m.DatetimeSelectionModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderRoutingModule { } 