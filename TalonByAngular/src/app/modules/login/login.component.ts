import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, CommonModule, HeaderComponent, FooterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {
    this.loginForm = new FormGroup({
      email: new FormControl(''),
      password: new FormControl(''),
    });
  }

  get email(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  login(): void {
    if (this.loginForm.valid) {
      this.authService
        .login(this.email.value, this.password.value)
        .pipe(
          catchError((error) => {
            this.errorMessage = 'Ошибка при логине: ' + error.message;
            return throwError(() => error);
          })
        )
        .subscribe({
          next: (response) => {
            if (response && response.token) {
              localStorage.setItem('token', response.token);
              this.router.navigate(['/main']);
            }
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Ошибка при входе';
          }
        });
    } else {
      this.errorMessage = 'Пожалуйста, заполните все поля.';
    }
  }
}
