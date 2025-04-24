import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { NgxMaskDirective } from 'ngx-mask';
import { provideNgxMask } from 'ngx-mask';
import { VerificationService } from '../../core/services/verification.service';
import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule, 
    ReactiveFormsModule, 
    CommonModule, 
    HeaderComponent, 
    FooterComponent,
    NgxMaskDirective
  ],
  providers: [provideNgxMask()],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  registrationForm: FormGroup;
  errorMessage: string = '';
  registrationError: string = '';
  isRightPanelActive = false;
  showVerification = false;
  verificationCode = '';
  verificationContact = '';
  verificationMethod: 'email' | 'phone' = 'email';
  attemptsLeft = 3;
  nextAttemptTime: Date | null = null;
  verificationError = '';
  public isRegistering = false;
  public isResending = false;
  public resendTimeout = 0;
  private registerSubject = new Subject<void>();
  private resendTimer: any;
  isLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private verificationService: VerificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};:\'",.<>/?\\\\|`~]*$')
      ]]
    });

    this.registrationForm = this.formBuilder.group({
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
      ]],
      phone: ['', [
        Validators.required,
        Validators.pattern('^\\+375\\([0-9]{2}\\)[0-9]{3}-[0-9]{2}-[0-9]{2}$')
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.pattern('^(?=.*[A-Z])(?=.*\\d)[A-Za-z\\d!@#$%^&*()_+\\-=\\[\\]{};:\'",.<>/?\\\\|`~]*$')
      ]]
    });

    // Проверяем параметр mode
    this.route.queryParams.subscribe(params => {
      if (params['mode'] === 'register') {
        this.isRightPanelActive = true;
      }
    });
  }
  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = ''; // Очищаем сообщение об ошибке
      const { email, password } = this.loginForm.value;
      
      console.log('Trying to login user:', email);
      
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Login successful');
          // Получаем URL для перенаправления или переходим на главную
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/main';
          // Небольшая задержка, чтобы успели применится изменения состояния
          setTimeout(() => {
            this.router.navigate([returnUrl]);
          }, 100);
        },
        error: (error) => {
          console.error('Login error:', error);
          this.errorMessage = this.getServerErrorMessage(error);
          this.isLoading = false;
        },
        complete: () => {
          this.isLoading = false;
        }
      });
    } else {
      // Если форма невалидна, отмечаем все поля как "тронутые"
      this.markFormGroupTouched(this.loginForm);
    }
  }
  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
  ngOnInit() {
    this.registerSubject.pipe(
      debounceTime(500) // Игнорировать повторные клики в течение 500мс
    ).subscribe(() => {
      this.proceedWithRegistration();
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

  getEmailError(form: 'login' | 'register'): string {
    const email = form === 'login' ? 
      this.loginForm.get('email') : 
      this.registrationForm.get('email');
    
    if (email?.errors) {
      if (email.errors['required']) {
        return 'Email обязателен';
      }
      if (email.errors['email'] || email.errors['pattern']) {
        return 'Введите корректный email';
      }
    }
    return '';
  }

  getPasswordError(form: 'login' | 'register'): string {
    const password = form === 'login' ? 
      this.loginForm.get('password') : 
      this.registrationForm.get('password');
    
    if (password?.errors) {
      if (password.errors['required']) {
        return 'Пароль обязателен';
      }
      if (password.errors['minlength']) {
        return 'Пароль должен быть не менее 6 символов';
      }
      if (password.errors['pattern']) {
        return 'Пароль должен содержать только латинские буквы, хотя бы одну заглавную букву и цифру';
      }
    }
    return '';
  }

  getPhoneError(): string {
    const phone = this.registrationForm.get('phone');
    
    if (phone?.errors) {
      if (phone.errors['required']) {
        return 'Телефон обязателен';
      }
      if (phone.errors['pattern']) {
        return 'Формат: +375 (XX) XXX-XX-XX';
      }
    }
    return '';
  }

  sendVerificationCode() {
    if (this.isResending || this.resendTimeout > 0) return;
    
    this.isResending = true;
    this.verificationService.resendVerification(this.verificationContact)
      .subscribe({
        next: () => {
          this.verificationError = 'Код успешно отправлен';
          this.startResendTimer();
          setTimeout(() => this.verificationError = '', 3000);
        },
        error: (error) => {
          this.verificationError = this.getServerErrorMessage(error);
        },
        complete: () => {
          this.isResending = false;
        }
      });
  }

  private startResendTimer() {
    this.resendTimeout = 30;
    this.resendTimer = setInterval(() => {
      this.resendTimeout--;
      if (this.resendTimeout <= 0) {
        clearInterval(this.resendTimer);
      }
    }, 1000);
  }

  verifyCode() {
    if (this.nextAttemptTime && new Date() < this.nextAttemptTime) {
      const waitSeconds = Math.ceil((this.nextAttemptTime.getTime() - new Date().getTime()) / 1000);
      this.verificationError = `Пожалуйста, подождите ${waitSeconds} секунд перед следующей попыткой`;
      return;
    }

    this.verificationService.verifyEmail(this.verificationContact, this.verificationCode)
      .subscribe({
        next: () => {
          this.showVerification = false;
          this.isRightPanelActive = false;
          // Заполняем поле email в форме входа
          this.loginForm.patchValue({ email: this.verificationContact });
          this.loginForm.get('password')?.setErrors(null); // Сбрасываем ошибки пароля
          this.verificationError = '';
          this.attemptsLeft = 3;
          this.nextAttemptTime = null;
          
          // Показываем сообщение об успешной регистрации
          this.errorMessage = 'Регистрация успешно завершена! Вы можете войти, используя свой email и пароль.';
          
          // Очищаем сообщение через 5 секунд
          setTimeout(() => {
            if (this.errorMessage === 'Регистрация успешно завершена! Вы можете войти, используя свой email и пароль.') {
              this.errorMessage = '';
            }
          }, 5000);
        },
        error: (error) => {
          this.attemptsLeft--;
          if (this.attemptsLeft <= 0) {
            this.nextAttemptTime = new Date(Date.now() + 60000); // +1 минута
            this.attemptsLeft = 3;
            this.verificationError = 'Слишком много попыток. Пожалуйста, подождите 1 минуту';
          } else {
            this.verificationError = `Неверный код. Осталось попыток: ${this.attemptsLeft}`;
          }
        }
      });
  }

  onRegister() {
    if (this.registrationForm.valid) {
      this.registerSubject.next();
    }
  }

  private proceedWithRegistration() {
    if (this.isRegistering) return;
  
    this.isRegistering = true;
    const { email, password, phone } = this.registrationForm.value;
    const cleanPhone = phone.replace(/[\s()-]/g, '');
    
    this.authService.register({ 
      email, 
      password, 
      phone: cleanPhone,
      fullName: '' // Required by interface but not used in this context
    }).subscribe({
      next: (response) => {
        this.verificationContact = email;
        this.verificationMethod = 'email';
        this.showVerification = true;
      },
      error: (error) => {
        this.registrationError = this.getServerErrorMessage(error);
        this.isRegistering = false; // Важно! Останавливаем спиннер при ошибке
      },
      complete: () => {
        this.isRegistering = false;
      }
    });
  }

  private getServerErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.error?.title) {
      return error.error.title;
    }
    if (error?.message) {
      // Обработка общих ошибок
      if (error.message.includes('Http failure response for')) {
        return 'Не удалось соединиться с сервером. Пожалуйста, проверьте подключение к интернету.';
      }
      return error.message;
    }
    // Если ничего не подошло, возвращаем общее сообщение
    return 'Произошла ошибка при входе. Пожалуйста, попробуйте снова позже.';
  }

  closeVerification() {
    this.showVerification = false;
    this.verificationCode = '';
    this.verificationError = '';
    this.attemptsLeft = 3;
    this.nextAttemptTime = null;
    this.resendTimeout = 0;
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }

  ngOnDestroy() {
    if (this.resendTimer) {
      clearInterval(this.resendTimer);
    }
  }
}
