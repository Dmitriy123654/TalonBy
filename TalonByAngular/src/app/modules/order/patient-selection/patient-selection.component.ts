import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Hospital, DoctorDetails, TimeSlot } from '../../../shared/interfaces/order.interface';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User, Patient } from '../../../shared/interfaces/user.interface';
import { Subscription } from 'rxjs';

interface PhoneItem {
  isLabel: boolean;
  text: string;
}

@Component({
  selector: 'app-patient-selection',
  templateUrl: './patient-selection.component.html',
  styleUrls: ['./patient-selection.component.scss']
})
export class PatientSelectionComponent implements OnInit, OnDestroy {
  hospital: Hospital | null = null;
  doctor: DoctorDetails | null = null;
  speciality: any = null;
  selectedDate: Date | null = null;
  selectedTimeSlot: TimeSlot | null = null;
  loading = false;
  error: string | null = null;
  
  // Updated to be empty array - will be populated from API
  patients: Patient[] = [];
  hasPatients = false;
  
  isMobile = false;
  isDetailsOpen = false;
  
  private apiUrl = environment.apiUrl;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private http: HttpClient,
    private orderService: OrderService,
    private authService: AuthService,
    private userService: UserService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state) {
      this.hospital = state['hospital'];
      this.doctor = state['doctor'];
      this.speciality = state['speciality'];
      this.selectedDate = state['selectedDate'];
      this.selectedTimeSlot = state['selectedTimeSlot'];
    } else {
      // Try to get data from order service if not available in state
      this.hospital = this.orderService.getSelectedHospital();
      this.doctor = this.orderService.getSelectedDoctor();
      this.selectedDate = this.orderService.getSelectedDateTime();
    }
    this.checkScreenSize();
  }

  ngOnInit(): void {
    if (!this.hospital || !this.doctor || !this.selectedDate || !this.selectedTimeSlot) {
      this.router.navigate(['/order']);
      return;
    }
    
    this.loadPatients();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }
  
  loadPatients(): void {
    this.loading = true;
    
    // Проверяем авторизацию пользователя
    if (!this.authService.isAuthenticated()) {
      this.error = 'Необходимо авторизоваться для просмотра пациентов';
      this.loading = false;
      return;
    }
    
    // Получаем профиль пользователя с пациентами через UserService
    const profileSub = this.userService.getUserProfile(true).subscribe({
      next: (user: User) => {
        if (user && user.patients) {
          this.patients = user.patients;
          this.hasPatients = this.patients.length > 0;
        } else {
          this.patients = [];
          this.hasPatients = false;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.error = 'Не удалось загрузить список пациентов';
        this.patients = [];
        this.hasPatients = false;
        this.loading = false;
      }
    });
    
    this.subscriptions.add(profileSub);
  }

  checkScreenSize(): void {
    this.isMobile = window.innerWidth < 768;
  }

  toggleDetails(): void {
    this.isDetailsOpen = !this.isDetailsOpen;
  }

  getFormattedDate(): string {
    if (!this.selectedDate) return '';
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' };
    return this.selectedDate.toLocaleDateString('ru-RU', options);
  }

  getFormattedTime(): string {
    return this.selectedTimeSlot?.startTime || '';
  }

  goToSpeciality(): void {
    this.router.navigate(['/order/speciality'], {
      state: { hospital: this.hospital }
    });
  }

  goToDoctor(): void {
    this.router.navigate(['/order/doctor'], {
      state: { 
        hospital: this.hospital,
        speciality: this.speciality
      }
    });
  }

  goToDatime(): void {
    this.router.navigate(['/order/datetime'], {
      state: { 
        hospital: this.hospital,
        doctor: this.doctor,
        speciality: this.speciality
      }
    });
  }

  selectPatient(patient: Patient): void {
    // Save the selected patient and navigate to the confirmation page
    console.log('Selected patient:', patient);
    
    // Navigate to confirmation page with all necessary data
    this.router.navigate(['/order/confirmation'], { 
      state: { 
        hospital: this.hospital,
        doctor: this.doctor,
        speciality: this.speciality,
        selectedDate: this.selectedDate,
        selectedTimeSlot: this.selectedTimeSlot,
        patient: patient
      }
    });
  }

  addNewPatient(): void {
    // Redirect to profile page to create a new patient
    this.router.navigate(['/profile'], { queryParams: { action: 'add-patient' } });
  }

  goToCreatePatient(): void {
    // Redirect to profile page to create a new patient
    this.router.navigate(['/profile'], { queryParams: { action: 'add-patient' } });
  }

  getRemainingPatientsSlots(): number[] {
    const maxPatients = 6;
    const current = this.patients.length;
    const remaining = Math.max(0, maxPatients - current);
    return Array(remaining).fill(0).map((_, i) => i);
  }

  getPhones(): PhoneItem[] {
    if (!this.hospital?.phones) return [];
    
    const result: PhoneItem[] = [];
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

  getWorkingHours(day: string): string {
    if (!this.hospital?.workingHours) return '';
    
    if (this.hospital.workingHours.toLowerCase().includes('круглосуточно')) {
      return 'круглосуточно';
    }

    const schedules = this.hospital.workingHours.split(',');
    const daySchedule = schedules.find((schedule: string) => 
      schedule.trim().startsWith(day)
    );
    
    if (daySchedule) {
      const timeMatch = daySchedule.match(/(?:ПН-ПТ|СБ):\s*([\d:-]+)/);
      return timeMatch ? timeMatch[1].trim() : '';
    }

    return '';
  }

  getDomain(url: string | undefined): string {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  }
}
