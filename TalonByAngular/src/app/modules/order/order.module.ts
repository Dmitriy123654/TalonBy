import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { OrderRoutingModule } from './order-routing.module';
import { OrderComponent } from './order.component';
import { Nl2brPipe } from '../../pipes/nl2br.pipe';

@NgModule({
  declarations: [
    OrderComponent,
    Nl2brPipe
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    OrderRoutingModule
  ]
})
export class OrderModule { } 