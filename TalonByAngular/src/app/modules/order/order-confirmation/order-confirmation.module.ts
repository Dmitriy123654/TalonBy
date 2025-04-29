import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderConfirmationComponent } from './order-confirmation.component';
import { RouterModule } from '@angular/router';

@NgModule({
  declarations: [
    OrderConfirmationComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: '',
        component: OrderConfirmationComponent
      }
    ])
  ]
})
export class OrderConfirmationModule { } 