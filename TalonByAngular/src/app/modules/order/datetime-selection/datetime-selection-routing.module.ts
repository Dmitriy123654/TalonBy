import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DatetimeSelectionComponent } from './datetime-selection.component';

const routes: Routes = [
  { path: '', component: DatetimeSelectionComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DatetimeSelectionRoutingModule { } 