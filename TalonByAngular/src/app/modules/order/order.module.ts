import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { OrderRoutingModule } from './order-routing.module';
import { OrderComponent } from './order.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    OrderComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrderRoutingModule,
    SharedModule
  ]
})
export class OrderModule { } 