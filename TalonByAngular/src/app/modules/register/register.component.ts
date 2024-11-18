import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { RegisterService } from './register.service';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  registrationForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private registerService: RegisterService,
    private router: Router
  ) {
    this.registrationForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telephone: ['', [Validators.required, Validators.minLength(6)]],
    });
  }
  ngOnInit() {
    const url = window.location.href.toLowerCase();
    if (url.includes('register')) {
      this.router.navigate(['/register']);
    }
  }
  onSubmit() {
    if (this.registrationForm.valid) {
      this.registerService
        .register(
          this.registrationForm.get('email')?.value,
          this.registrationForm.get('password')?.value,
          this.registrationForm.get('telephone')?.value
        )
        .subscribe(
          (response) => {
            // Сохранение токена аутентификации
            if (response != null && response.token) {
              localStorage.setItem('authToken', response.token);
            }
            console.log('Пользователь зарегистрирован');
            this.router.navigate(['/login']);
          },
          (error) => {
            // Обработка ошибок
            this.errorMessage =
              error.message || 'Произошла ошибка при регистрации.';
          }
        );
    }
  }
}
