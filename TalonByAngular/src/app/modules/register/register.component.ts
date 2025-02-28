import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
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
    private authService: AuthService,
    private router: Router
  ) {
    this.registrationForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: ['', [Validators.required, Validators.pattern('^\\+375(17|25|29|33|44)[0-9]{7}$')]]
    });
  }

  // Геттеры для удобного доступа к полям формы
  get email() { return this.registrationForm.get('email'); }
  get password() { return this.registrationForm.get('password'); }
  get phone() { return this.registrationForm.get('phone'); }

  onSubmit() {
    if (this.registrationForm.valid) {
      const { email, password, phone } = this.registrationForm.value;
      
      this.authService.register(email, password, phone).subscribe({
        next: () => {
          console.log('Регистрация успешна');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          console.error('Ошибка регистрации:', error);
          this.errorMessage = error.error?.message || 'Произошла ошибка при регистрации';
        }
      });
    } else {
      this.markFormGroupTouched(this.registrationForm);
    }
  }

  // Помечаем все поля формы как "тронутые" для отображения ошибок
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
