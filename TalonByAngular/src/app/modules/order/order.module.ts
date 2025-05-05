import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { OrderRoutingModule } from './order-routing.module';
import { OrderComponent } from './order.component';
import { SharedModule } from '../../shared/shared.module';
import { PatientSelectionComponent } from './patient-selection/patient-selection.component';
import { ImageService } from '../../core/services/image.service';

@NgModule({
  declarations: [
    OrderComponent,
    PatientSelectionComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrderRoutingModule,
    SharedModule
  ],
  providers: [
    ImageService
  ]
})
export class OrderModule { } 