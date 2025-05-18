import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MedicalDetailsService } from '../../../../core/services/medical-details.service';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MedicalAppointmentDTO } from '../../../../shared/interfaces/medical-appointment.interface';
import { AppointmentMedicalDetails } from '../../../../shared/interfaces/appointment-medical-details.interface';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../shared/interfaces/user.interface';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-appointment-details',
  templateUrl: './appointment-details.component.html',
  styleUrls: ['./appointment-details.component.scss']
})
export class AppointmentDetailsComponent implements OnInit, OnDestroy {
  appointmentId!: number;
  appointment: MedicalAppointmentDTO | null = null;
  medicalDetails: AppointmentMedicalDetails | null = null;
  currentUser: User | null = null;
  showStatusDropdown: boolean = false;
  
  detailsForm!: FormGroup;
  
  loading = {
    appointment: false,
    medicalDetails: false,
    saving: false,
    patientCard: false,
    statusUpdate: false
  };
  
  success: string = '';
  error: string = '';
  
  isToday: boolean = false;
  viewMode: boolean = false;
  userRole: string = '';
  
  private subscriptions = new Subscription();
  
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder,
    private appointmentService: AppointmentService,
    private medicalDetailsService: MedicalDetailsService,
    private authService: AuthService,
    private userService: UserService
  ) {
    this.detailsForm = this.fb.group({
      diagnosis: ['', [Validators.required, Validators.maxLength(300)]],
      treatment: ['', [Validators.required, Validators.maxLength(3000)]],
      prescriptions: ['', [Validators.required, Validators.maxLength(500)]],
      labResults: ['', Validators.maxLength(3000)],
      medicalHistory: ['', Validators.maxLength(3000)],
      allergies: ['', Validators.maxLength(500)],
      vitalSigns: ['', Validators.maxLength(1000)],
      nextAppointmentDate: ['']
    });
    
    // Получаем роль пользователя из AuthService
    const userInfo = this.authService.getUserInfo();
    this.userRole = userInfo?.role || '';
  }

  ngOnInit(): void {
    // Загружаем данные о пользователе
    this.loadUserProfile();
    
    // Получаем ID талона из параметров роута
    this.route.params.subscribe(params => {
      this.appointmentId = +params['id'];
      if (this.appointmentId) {
        this.loadAppointmentData();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  // Загрузка данных о пользователе
  loadUserProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
        // В случае ошибки используем информацию из JWT
        const userInfo = this.authService.getUserInfo();
        if (userInfo) {
          this.currentUser = {
            userId: parseInt(userInfo.userId.toString(), 10),
            email: userInfo.email,
            fullName: 'Пользователь',
            role: userInfo.role
          };
        }
      }
    });
  }
  
  // Загрузка данных талона
  loadAppointmentData(): void {
    this.loading.appointment = true;
    this.error = '';
    
    // Используем временный фильтр для получения конкретного талона
    const filter = {
      appointmentId: this.appointmentId
    };
    
    console.log('Загружаем данные талона, ID:', this.appointmentId);
    
    this.subscriptions.add(
      this.appointmentService.getFilteredAppointments(filter).subscribe({
        next: (appointments) => {
          console.log('Получены данные талонов:', appointments);
          
          if (appointments && appointments.length > 0) {
            this.appointment = appointments[0];
            console.log('Выбран талон:', this.appointment);
            
            // Проверяем, является ли талон сегодняшним
            const today = new Date();
            const appointmentDate = new Date(this.appointment.date);
            this.isToday = today.toDateString() === appointmentDate.toDateString();
            
            // Устанавливаем режим просмотра только если пользователь не имеет нужной роли и талон не сегодняшний
            if (this.userRole === 'Administrator' || this.userRole === 'ChiefDoctor' || this.userRole === 'Doctor') {
              // Администраторы, главврачи и врачи всегда могут редактировать
              this.viewMode = false;
            } else {
              // Другие роли могут редактировать только сегодняшние талоны
              this.viewMode = !this.isToday;
            }
            
            // Загружаем медицинские детали
            this.loadMedicalDetails();
          } else {
            this.error = 'Талон не найден';
          }
          this.loading.appointment = false;
        },
        error: (err) => {
          console.error('Ошибка при загрузке талона:', err);
          this.error = 'Не удалось загрузить данные талона';
          this.loading.appointment = false;
        }
      })
    );
  }
  
  // Загрузка медицинских деталей
  loadMedicalDetails(): void {
    this.loading.medicalDetails = true;
    
    this.subscriptions.add(
      this.medicalDetailsService.getByAppointmentId(this.appointmentId).subscribe({
        next: (details) => {
          this.medicalDetails = details;
          if (details) {
            this.populateForm(details);
          } else {
            // Если данных нет, просто сбрасываем форму
            this.detailsForm.reset();
            
            // Если мы в режиме просмотра, а данных нет, показываем сообщение
            if (this.viewMode) {
              this.error = 'Для данного талона ещё не созданы медицинские детали';
            }
          }
          this.loading.medicalDetails = false;
        },
        error: (err) => {
          // Если запрос вернул 404, значит деталей еще нет
          if (err.status === 404) {
            this.medicalDetails = null;
            this.detailsForm.reset();
            if (this.viewMode) {
              this.error = 'Для данного талона ещё не созданы медицинские детали';
            }
          } 
          // Если запрос вернул 403, значит недостаточно прав
          else if (err.status === 403) {
            // Для администраторов показываем ошибку, но не переключаем в режим просмотра
            if (this.userRole === 'Administrator') {
              this.error = 'Сервер вернул ошибку доступа 403, но вы можете продолжить как администратор';
              this.medicalDetails = null;
              this.detailsForm.reset();
            } else {
              this.error = 'Недостаточно прав для просмотра медицинских деталей. Необходима роль Врача или Администратора.';
              this.medicalDetails = null;
              this.detailsForm.reset();
              this.detailsForm.disable();
              this.viewMode = true;
            }
          }
          else {
            console.error('Ошибка при загрузке медицинских деталей:', err);
            this.error = 'Не удалось загрузить медицинские детали';
          }
          this.loading.medicalDetails = false;
        }
      })
    );
  }
  
  // Заполнение формы данными
  populateForm(details: AppointmentMedicalDetails): void {
    if (!details) {
      this.detailsForm.reset();
      return;
    }
    
    this.detailsForm.patchValue({
      diagnosis: details.diagnosis || '',
      treatment: details.treatment || '',
      prescriptions: details.prescriptions || '',
      labResults: details.labResults || '',
      medicalHistory: details.medicalHistory || '',
      allergies: details.allergies || '',
      vitalSigns: details.vitalSigns || '',
      nextAppointmentDate: details.nextAppointmentDate ? details.nextAppointmentDate.toString().split('T')[0] : ''
    });
    
    // Блокируем форму, если в режиме просмотра
    if (this.viewMode) {
      this.detailsForm.disable();
    }
  }
  
  // Сохранение формы
  saveDetails(): void {
    if (this.detailsForm.invalid) {
      // Помечаем все поля как touched для отображения ошибок валидации
      Object.keys(this.detailsForm.controls).forEach(key => {
        const control = this.detailsForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.loading.saving = true;
    this.error = '';
    this.success = '';
    
    const formValue = this.detailsForm.value;
    
    if (this.medicalDetails) {
      // Обновление существующих деталей
      this.subscriptions.add(
        this.medicalDetailsService.update(this.medicalDetails.appointmentMedicalDetailsId, formValue).subscribe({
          next: (updatedDetails) => {
            // Проверяем, получили ли мы ошибку 403 с флагом isError
            if (updatedDetails && (updatedDetails as any).isError) {
              const errorResp = updatedDetails as any;
              if (errorResp.status === 403) {
                if (this.userRole === 'Administrator') {
                  this.error = 'Сервер вернул ошибку доступа 403, но вы можете продолжить как администратор';
                } else {
                  this.error = errorResp.message || 'Недостаточно прав для редактирования медицинских деталей';
                  this.viewMode = true;
                  this.detailsForm.disable();
                }
              } else {
                this.error = errorResp.message || 'Произошла ошибка при обновлении';
              }
              this.loading.saving = false;
              return;
            }
            
            // Нормальная обработка успешного ответа
            this.medicalDetails = updatedDetails;
            this.success = 'Медицинские детали успешно обновлены';
            this.loading.saving = false;
            
            // Перезагружаем детали для обновления данных
            this.loadMedicalDetails();
          },
          error: (err) => {
            console.error('Ошибка при обновлении медицинских деталей:', err);
            // Проверяем, является ли ошибка ошибкой доступа (403)
            if (err && err.status === 403) {
              if (this.userRole === 'Administrator') {
                this.error = 'Сервер вернул ошибку доступа 403, но вы можете продолжить как администратор';
              } else {
                this.error = err.message || 'Недостаточно прав для редактирования медицинских деталей. Необходима роль Врача.';
                // Переключаемся в режим просмотра
                this.viewMode = true;
                this.detailsForm.disable();
              }
            } else {
              this.error = 'Не удалось обновить медицинские детали';
            }
            this.loading.saving = false;
          }
        })
      );
    }
  }
  
  // Автоматическое заполнение данных (заглушка)
  autoFillDetails(): void {
    // Здесь будет реализована логика автоматического заполнения
    alert('Функция автоматического заполнения будет доступна в следующей версии');
  }
  
  // Возврат к списку талонов
  goBackToList(): void {
    // Сохраняем текущие фильтры в localStorage с помощью 
    // навигации к списку талонов, чтобы сохранить состояние фильтров
    this.router.navigate(['/admin'], {
      queryParams: { activeTab: 'appointments' }
    });
  }
  
  // Открыть карточку пациента
  openPatientCard(): void {
    if (this.appointment) {
      // Важно: тут патиент ID отсутствует в DTO, использовать напрямую URL API
      const patientId = this.appointment.patientId || 
                        (this.appointment as any).patient?.patientId;
      
      console.log('Открываем карточку пациента', patientId);
      
      // Получаем patientId из URL, если он есть в параметрах запроса
      if (patientId) {
        this.router.navigate(['/admin'], { 
          queryParams: { 
            activeTab: 'patients',
            patientId: patientId,
            returnUrl: `/admin/appointments/details/${this.appointmentId}`
          }
        });
      } else {
        // Если нет ID, можно сообщить об ошибке или использовать patientName для поиска
        this.error = 'Не удалось найти ID пациента. Пожалуйста, найдите пациента по имени на странице "Пациенты".';
      }
    }
  }
  
  // Форматирование даты для отображения
  formatDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  }

  // Получение текстового представления статуса на русском
  getStatusText(status: string | number): string {
    const statusStr = String(status).toLowerCase();
    
    switch (statusStr) {
      case 'waiting':
        return 'Ожидается';
      case 'completed':
        return 'Выполнен';
      case 'cancelled':
        return 'Отменен';
      case '0':
        return 'Выполнен';
      case '1':
        return 'Ожидается';
      case '2':
        return 'Отменен';
      default:
        return String(status);
    }
  }

  // Обновление карточки пациента на основе медицинских деталей
  updatePatientCard(): void {
    if (!this.medicalDetails || !this.appointment) {
      this.error = 'Нет данных для обновления карточки пациента';
      return;
    }

    this.loading.patientCard = true;
    this.error = '';
    this.success = '';

    // Важно: тут патиент ID отсутствует в DTO, использовать напрямую URL API
    const patientId = this.appointment.patientId || 
                      (this.appointment as any).patient?.patientId;
    
    console.log('Обновляем карточку пациента', patientId);
    
    if (patientId) {
      this.router.navigate(['/admin'], { 
        queryParams: { 
          activeTab: 'patients',
          patientId: patientId,
          returnUrl: `/admin/appointments/details/${this.appointmentId}`
        }
      });
    } else {
      this.error = 'Не удалось найти ID пациента. Пожалуйста, найдите пациента по имени на странице "Пациенты".';
    }
    
    this.loading.patientCard = false;
  }

  // Создание новых медицинских деталей
  createNewDetails(): void {
    if (this.detailsForm.invalid) {
      // Помечаем все поля как touched для отображения ошибок валидации
      Object.keys(this.detailsForm.controls).forEach(key => {
        const control = this.detailsForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    this.error = '';
    this.success = '';
    this.loading.saving = true;
    
    const formValue = this.detailsForm.value;
    const newDetails = {
      ...formValue,
      medicalAppointmentId: this.appointmentId
    };
    
    this.subscriptions.add(
      this.medicalDetailsService.create(newDetails).subscribe({
        next: (createdDetails) => {
          // Проверяем, получили ли мы ошибку 403 с флагом isError
          if (createdDetails && (createdDetails as any).isError) {
            const errorResp = createdDetails as any;
            if (errorResp.status === 403) {
              if (this.userRole === 'Administrator') {
                this.error = 'Сервер вернул ошибку доступа 403, но вы можете продолжить как администратор';
              } else {
                this.error = errorResp.message || 'Недостаточно прав для создания медицинских деталей';
                this.viewMode = true;
                this.detailsForm.disable();
              }
            } else {
              this.error = errorResp.message || 'Произошла ошибка при создании';
            }
            this.loading.saving = false;
            return;
          }
          
          // Нормальная обработка успешного ответа
          this.medicalDetails = createdDetails;
          this.success = 'Медицинские детали успешно созданы';
          this.loading.saving = false;
          
          // Перезагружаем детали для обновления данных
          this.loadMedicalDetails();
        },
        error: (err) => {
          console.error('Ошибка при создании медицинских деталей:', err);
          // Проверяем, является ли ошибка ошибкой доступа (403)
          if (err && err.status === 403) {
            if (this.userRole === 'Administrator') {
              this.error = 'Сервер вернул ошибку доступа 403, но вы можете продолжить как администратор';
            } else {
              this.error = err.message || 'Недостаточно прав для создания медицинских деталей. Необходима роль Врача.';
              // Переключаемся в режим просмотра
              this.viewMode = true;
              this.detailsForm.disable();
            }
          } else {
            this.error = 'Не удалось создать медицинские детали';
          }
          this.loading.saving = false;
        }
      })
    );
  }

  // Методы для навигации между вкладками
  navigateToSchedule(): void {
    this.router.navigate(['/admin'], { queryParams: { activeTab: 'schedule' } });
  }
  
  navigateToPatients(): void {
    this.router.navigate(['/admin'], { queryParams: { activeTab: 'patients' } });
  }
  
  navigateToDoctors(): void {
    this.router.navigate(['/admin'], { queryParams: { activeTab: 'doctors' } });
  }
  
  navigateToHospitals(): void {
    this.router.navigate(['/admin'], { queryParams: { activeTab: 'hospitals' } });
  }
  
  navigateToUsers(): void {
    this.router.navigate(['/admin'], { queryParams: { activeTab: 'users' } });
  }

  // Включение/выключение выпадающего списка статусов
  toggleStatusDropdown(event: Event): void {
    event.stopPropagation(); // Предотвращаем всплытие события
    this.showStatusDropdown = !this.showStatusDropdown;
    
    // Добавляем слушатель клика на документ, чтобы закрыть выпадающий список при клике вне его
    if (this.showStatusDropdown) {
      setTimeout(() => {
        document.addEventListener('click', this.closeStatusDropdown);
      }, 0);
    }
  }
  
  // Метод для закрытия выпадающего списка
  closeStatusDropdown = (): void => {
    this.showStatusDropdown = false;
    document.removeEventListener('click', this.closeStatusDropdown);
  }
  
  // Обновление статуса талона
  updateStatus(status: string): void {
    if (!this.appointment || this.loading.statusUpdate) return;
    
    this.loading.statusUpdate = true;
    this.error = '';
    this.success = '';
    
    // Предотвращаем изменение статуса на тот же самый
    if (this.appointment.receptionStatus.toLowerCase() === status) {
      this.loading.statusUpdate = false;
      this.showStatusDropdown = false;
      return;
    }
    
    // Получаем числовой идентификатор статуса
    const statusId = this.getStatusIdByName(status);
    
    // Используем единый метод для обновления статуса
    this.appointmentService.updateAppointmentStatus(this.appointmentId, statusId).subscribe({
      next: () => {
        this.success = `Статус талона успешно изменен на "${this.getStatusText(status)}"`;
        
        // Обновляем статус в локальной модели
        if (this.appointment) {
          this.appointment.receptionStatus = status;
        }
        
        this.loading.statusUpdate = false;
        this.showStatusDropdown = false;
        
        // Перезагружаем данные талона через 5 секунд для проверки состояния
        setTimeout(() => {
          this.checkAppointmentStatus();
        }, 5000);
      },
      error: (err: any) => {
        console.error('Ошибка при обновлении статуса талона:', err);
        this.error = 'Не удалось обновить статус талона. Пожалуйста, попробуйте позже.';
        if (err.error && err.error.message) {
          this.error += ` Детали: ${err.error.message}`;
        }
        this.loading.statusUpdate = false;
        this.showStatusDropdown = false;
      }
    });
  }
  
  // Проверка статуса талона без обновления модели
  checkAppointmentStatus(): void {
    const filter = {
      appointmentId: this.appointmentId
    };
    
    this.appointmentService.getFilteredAppointments(filter).subscribe({
      next: (appointments) => {
        if (appointments && appointments.length > 0) {
          const serverAppointment = appointments[0];
          
          // Если статусы не совпадают (с учетом регистра), показываем предупреждение
          if (this.appointment && 
              serverAppointment.receptionStatus.toLowerCase() !== this.appointment.receptionStatus.toLowerCase()) {
            console.warn(`Несоответствие статусов! На сервере: ${serverAppointment.receptionStatus}, в UI: ${this.appointment.receptionStatus}`);
            this.error = `Внимание! Статус на сервере (${this.getStatusText(serverAppointment.receptionStatus)}) отличается от отображаемого. Перезагрузите страницу.`;
          }
        }
      },
      error: (err) => {
        console.error('Ошибка при проверке статуса талона:', err);
      }
    });
  }

  // Метод для получения числового ID статуса по его имени
  getStatusIdByName(statusName: string): number {
    switch (statusName.toLowerCase()) {
      case 'waiting':
        return 4; // ID в базе данных для статуса "Ожидается"
      case 'completed':
        return 2; // ID в базе данных для статуса "Выполнен"
      case 'cancelled':
        return 5; // ID в базе данных для статуса "Отменен"
      default:
        return 4; // По умолчанию - ожидается
    }
  }
} 