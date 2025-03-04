import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './modules/login/login.component';
import { MainComponent } from './modules/main/main.component';

const routes: Routes = [
  { path: '', redirectTo: '/main', pathMatch: 'full' }, // Редирект с корня на main
  { path: 'login', component: LoginComponent },
  { path: 'main', component: MainComponent },
  { path: '**', redirectTo: '/main' } // Редирект всех несуществующих путей на main
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { } 