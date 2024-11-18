import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { routes } from './app.routes';
import { AppComponent } from './app.component';
import { LoginComponent } from './modules/login/login.component';
import { RegisterComponent } from './modules/register/register.component';
import { HeaderComponent } from './modules/header/header.component';
import { HistoryOfPacientComponent } from './modules/history-of-pacient/history-of-pacient.component';
import { HospitalsComponent } from './modules/hospitals/hospitals.component';
import { TalonsComponent } from './modules/talons/talons.component';
import { ProfileComponent } from './modules/profile/profile.component';

// Другие импорты ваших компонентов, сервисов и модулей

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent,
    HistoryOfPacientComponent,
    HospitalsComponent,
    TalonsComponent,
    ProfileComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    CommonModule,
  ],
  // exports: [RouterModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
