import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatetimeSelectionRoutingModule } from './datetime-selection-routing.module';
import { DatetimeSelectionComponent } from './datetime-selection.component';

@NgModule({
  declarations: [DatetimeSelectionComponent],
  imports: [
    CommonModule,
    DatetimeSelectionRoutingModule
  ]
})
export class DatetimeSelectionModule { }
