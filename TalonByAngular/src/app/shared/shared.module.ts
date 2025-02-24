import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Nl2brPipe } from './pipes/nl2br.pipe';

@NgModule({
  declarations: [
    Nl2brPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    CommonModule,
    Nl2brPipe
  ]
})
export class SharedModule { } 