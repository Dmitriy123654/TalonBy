import { Component } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  FormBuilder,
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
  registrationForm: FormGroup;
  errorMessage: string = '';
  registrationError: string = '';
  isRightPanelActive = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    this.registrationForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^\\+375(17|25|29|33|44)[0-9]{7}$')]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Проверяем параметр mode
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'register') {
        this.isRightPanelActive = true;
      }
    });
  }

  get email(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  get password(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  togglePanel() {
    this.isRightPanelActive = !this.isRightPanelActive;
    
    // Сбрасываем ошибки при переключении
    this.errorMessage = '';
    this.registrationError = '';
    
    // Очищаем формы при переключении
    if (this.isRightPanelActive) {
      this.loginForm.reset();
    } else {
      this.registrationForm.reset();
    }
  }

  login() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          if (response && response.token) {
            this.router.navigate(['/main']);
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || 'Ошибка при входе';
        }
      });
    }
  }

  onRegister() {
    if (this.registrationForm.valid) {
      const { email, password, phone } = this.registrationForm.value;
      this.authService.register(email, password, phone).subscribe({
        next: () => {
          this.isRightPanelActive = false;
          this.loginForm.patchValue({ email });
        },
        error: (error) => {
          this.registrationError = error.error?.message || 'Ошибка при регистрации';
        }
      });
    }
  }
}
