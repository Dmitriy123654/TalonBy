import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router, RouterModule } from '@angular/router';
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

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(private authService: AuthService, private router: Router) {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(6),
      ]),
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
              // Токен уже сохраняется в AuthService
              this.router.navigate(['/main']);
            }
          },
          error: (error) => {
            this.errorMessage = error.error?.message || 'Ошибка при входе';
          }
        });
    }
  }
}
