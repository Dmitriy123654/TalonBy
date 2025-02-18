import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SpecialitySelectionComponent } from './speciality-selection.component';

const routes: Routes = [
  { path: '', component: SpecialitySelectionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SpecialitySelectionRoutingModule { } 