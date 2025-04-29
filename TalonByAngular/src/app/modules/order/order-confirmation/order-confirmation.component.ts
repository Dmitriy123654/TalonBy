import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order.service';
import { Hospital, DoctorDetails, TimeSlot } from '../../../shared/interfaces/order.interface';
import { Patient } from '../../../shared/interfaces/user.interface';
import { finalize } from 'rxjs/operators';
import { UserService } from '../../../core/services/user.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-order-confirmation',
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.scss']
})
export class OrderConfirmationComponent implements OnInit, OnDestroy {
  currentStep: number = 5;
  isMobile: boolean = false;
  isDetailsOpen: boolean = false;
  isLoading: boolean = false;
  error: string | null = null;
  isSuccess: boolean = false;
  
  hospital: Hospital | null = null;
  doctor: DoctorDetails | null = null;
  patient: Patient | null = null;
  appointmentDate: Date | null = null;
  appointmentTime: string = '';
  timeSlot: TimeSlot | null = null;
  
  // Form validation
  canConfirm: boolean = false;
  isConfirming: boolean = false;
  isConfirmed: boolean = false;
  errorMessage: string | null = null;
  mobileDetailsOpen: boolean = false;
  
  private subscriptions = new Subscription();
  
  constructor(
    private router: Router,
    private orderService: OrderService,
    private userService: UserService
  ) {
    this.checkScreenSize();
  }

  ngOnInit(): void {
    // Always try to load data from localStorage first to handle page refresh
    this.loadDataFromStorage();
    
    // Then check and update from OrderService if available
    this.loadOrderDetails();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
    this.subscriptions.unsubscribe();
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  private loadDataFromStorage(): void {
    // Try to load confirmation data from localStorage
    const storedConfirmationData = localStorage.getItem('orderConfirmationData');
    
    if (storedConfirmationData) {
      try {
        const data = JSON.parse(storedConfirmationData);
        this.doctor = data.selectedDoctor;
        this.hospital = data.selectedHospital;
        this.appointmentDate = data.selectedDateTime ? new Date(data.selectedDateTime) : null;
        this.patient = data.selectedPatient;
        this.timeSlot = data.selectedTimeSlot;
      } catch (error) {
        console.error('Failed to parse stored confirmation data', error);
      }
    }
  }
  
  private saveDataToStorage(): void {
    // Save current confirmation data to localStorage
    const confirmationData = {
      selectedDoctor: this.doctor,
      selectedHospital: this.hospital,
      selectedDateTime: this.appointmentDate?.toISOString(),
      selectedPatient: this.patient,
      selectedTimeSlot: this.timeSlot
    };
    
    localStorage.setItem('orderConfirmationData', JSON.stringify(confirmationData));
  }

  loadOrderDetails(): void {
    this.isLoading = true;

    this.hospital = this.orderService.getSelectedHospital();
    this.doctor = this.orderService.getSelectedDoctor();
    
    // Получаем данные из состояния маршрутизатора
    const state = history.state;
    if (state && state.patient && state.selectedTimeSlot) {
      this.patient = state.patient;
      this.timeSlot = state.selectedTimeSlot;
      
      // Сохраняем данные пациента и временного слота в localStorage
      try {
        localStorage.setItem('selectedPatient', JSON.stringify(this.patient));
        localStorage.setItem('selectedTimeSlot', JSON.stringify(this.timeSlot));
      } catch (error) {
        console.error('Ошибка при сохранении данных пациента и слота:', error);
      }
    } else {
      // Пытаемся восстановить данные из localStorage
      try {
        const savedPatient = localStorage.getItem('selectedPatient');
        const savedTimeSlot = localStorage.getItem('selectedTimeSlot');
        
        if (savedPatient) {
          this.patient = JSON.parse(savedPatient);
        }
        
        if (savedTimeSlot) {
          this.timeSlot = JSON.parse(savedTimeSlot);
        }
      } catch (error) {
        console.error('Ошибка при восстановлении данных пациента и слота:', error);
      }
    }
    
    this.appointmentDate = this.orderService.getSelectedDateTime();
    
    if (this.timeSlot) {
      this.appointmentTime = this.timeSlot.startTime;
    }
    
    // Проверяем, все ли необходимые данные присутствуют
    this.canConfirm = !!(this.hospital && this.doctor && this.patient && this.timeSlot);
    
    // Если не хватает данных, показываем сообщение об ошибке
    if (!this.canConfirm) {
      this.errorMessage = 'Не все данные для записи заполнены. Пожалуйста, вернитесь и заполните все необходимые поля.';
    }

    this.isLoading = false;
    this.saveDataToStorage();
  }

  toggleMobileDetails(): void {
    this.mobileDetailsOpen = !this.mobileDetailsOpen;
  }

  // Методы навигации
  goToSpeciality(): void {
    this.router.navigate(['/order/speciality'], {
      state: { hospital: this.hospital }
    });
  }

  goToDoctor(): void {
    this.router.navigate(['/order/doctor'], {
      state: { 
        hospital: this.hospital,
        speciality: this.doctor?.doctorsSpeciality
      }
    });
  }

  goToDateTime(): void {
    this.router.navigate(['/order/datetime'], {
      state: { 
        hospital: this.hospital,
        doctor: this.doctor,
        speciality: this.doctor?.doctorsSpeciality
      }
    });
  }

  goToPatient(): void {
    this.router.navigate(['/order/patient-selection'], {
      state: {
        hospital: this.hospital,
        doctor: this.doctor,
        speciality: this.doctor?.doctorsSpeciality,
        selectedDate: this.appointmentDate,
        selectedTimeSlot: this.timeSlot
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/order/patient-selection'], {
      state: {
        hospital: this.hospital,
        doctor: this.doctor,
        speciality: this.doctor?.doctorsSpeciality,
        selectedDate: this.appointmentDate,
        selectedTimeSlot: this.timeSlot
      }
    });
  }

  confirmOrder(): void {
    if (!this.canConfirm || this.isConfirming) return;
    
    this.isConfirming = true;
    this.errorMessage = null;
    
    if (!this.hospital || !this.doctor || !this.patient || !this.timeSlot) {
      this.errorMessage = 'Не все данные для записи заполнены. Пожалуйста, вернитесь и заполните все необходимые поля.';
      this.isConfirming = false;
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    const appointmentData = {
      patientId: this.patient.patientId,
      timeSlotId: this.timeSlot.id,
      departmentId: 1, // Default department ID if not selected
      hospitalId: this.hospital.hospitalId,
      doctorId: this.doctor.doctorId,
      status: 'Waiting'
    };
    
    const appointmentSub = this.orderService.createAppointment(appointmentData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.isSuccess = true;
        // После успешного создания записи обновляем статус слота (делаем недоступным)
        if (this.timeSlot) {
          this.orderService.updateTimeSlotStatus(this.timeSlot.id, false)
            .subscribe({
              next: () => {
                console.log('Статус слота успешно обновлен');
              },
              error: (error) => {
                console.error('Ошибка при обновлении статуса слота:', error);
                // Не показываем ошибку пользователю, т.к. запись уже создана
              }
            });
        }
        
        // Очищаем данные заказа из localStorage
        localStorage.removeItem('selectedPatient');
        localStorage.removeItem('selectedTimeSlot');
        this.orderService.clearOrderData(); // Вызываем метод очистки данных в сервисе
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.error?.message || 'Произошла ошибка при создании записи. Пожалуйста, попробуйте еще раз.';
      }
    });
    
    this.subscriptions.add(appointmentSub);
  }

  viewAppointments(): void {
    this.router.navigate(['/profile'], { queryParams: { tab: 'appointments' } });
  }

  createNewAppointment(): void {
    this.orderService.clearOrderData();
    this.router.navigate(['/order']);
  }

  // Форматирование даты для отображения
  formatDate(date: Date | string | null): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    return dateObj.toLocaleDateString('ru-RU', options);
  }
  
  // Форматирование времени для отображения
  formatTime(time: string | undefined): string {
    if (!time) return '';
    return time;
  }

  // Форматирование выбранной даты
  formatSelectedDate(): string {
    if (!this.appointmentDate) return '';
    
    const dateObj = this.appointmentDate;
    const dayOfWeek = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'][dateObj.getDay()];
    
    // Форматирование в виде "11.11.2001 (среда)"
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}.${month}.${year} (${dayOfWeek})`;
  }

  // Форматирование выбранного времени
  formatSelectedTime(): string {
    return this.appointmentTime;
  }

  // Безопасное форматирование даты рождения
  formatBirthDate(): string {
    if (!this.patient?.birthDate) return '';
    
    const dateObj = typeof this.patient.birthDate === 'string' 
      ? new Date(this.patient.birthDate) 
      : this.patient.birthDate;
    
    // Форматирование в виде "11.11.2001"
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}.${month}.${year}`;
  }

  // Получение первого телефонного номера больницы
  getFirstPhoneNumber(): string {
    if (!this.hospital?.phones) return '';
    
    const firstLine = this.hospital.phones.split('\n')[0];
    if (!firstLine) return '';
    
    // Ищем первый номер телефона
    const phoneMatch = firstLine.match(/(?:\+|\d)[\d\s-()]{10,}/);
    return phoneMatch ? phoneMatch[0] : firstLine;
  }

  // Получение форматированных телефонных номеров
  getPhones(): { isLabel: boolean; text: string }[] {
    if (!this.hospital?.phones) return [];
    
    const result: { isLabel: boolean; text: string }[] = [];
    const sections = this.hospital.phones.split(/(?=(?:Регистратура:|Женская консультация:|Стоматология:|Студенческая деревня:))/);
    
    sections.forEach((section: string) => {
      if (!section.trim()) return;
      
      const [label, ...numbers] = section.split(/(?=\+)/);
      if (label.trim()) {
        result.push({ isLabel: true, text: label.trim() });
      }
      
      numbers.forEach((number: string) => {
        if (number.trim()) {
          result.push({ isLabel: false, text: number.trim() });
        }
      });
    });
    
    return result;
  }

  // Получение рабочих часов для конкретного дня
  getWorkingHours(day: string): string {
    if (!this.hospital?.workingHours) return '';
    
    const regex = new RegExp(`${day}:\\s*([^,;]+)`);
    const match = this.hospital.workingHours.match(regex);
    return match ? match[1].trim() : '';
  }

  // Извлечение домена из URL
  getDomain(url: string | undefined): string {
    if (!url) return '';
    try {
      const domain = new URL(url).hostname;
      return domain;
    } catch (e) {
      return url;
    }
  }
}
