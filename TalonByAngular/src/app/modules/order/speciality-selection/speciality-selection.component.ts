import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Hospital, DoctorDetails } from '../../../interfaces/order.interface';
import { OrderService } from '../../../services/order.service';

interface Speciality {
  id: number;
  name: string;
  link: string;
}

interface PhoneItem {
  isLabel: boolean;
  text: string;
}

@Component({
  selector: 'app-speciality-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speciality-selection.component.html',
  styleUrl: './speciality-selection.component.scss'
})
export class SpecialitySelectionComponent implements OnInit, OnDestroy {
  hospital: Hospital | null = null;
  specialities: Speciality[] = [];
  loading = false;
  error: string | null = null;
  isMobile = false;
  isDetailsOpen = false;

  constructor(
    private router: Router,
    private orderService: OrderService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && 'hospital' in state) {
      this.hospital = state['hospital'];
      console.log('Received hospital in constructor:', this.hospital);
    }
    this.checkScreenSize();
  }

  ngOnInit(): void {
    if (!this.hospital || typeof this.hospital.hospitalId !== 'number') {
      console.warn('No hospital data or invalid hospital ID:', this.hospital);
      this.router.navigate(['/order']);
      return;
    }
    this.loadSpecialities();
    window.addEventListener('resize', this.checkScreenSize.bind(this));
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.checkScreenSize.bind(this));
  }

  private checkScreenSize(): void {
    this.isMobile = window.innerWidth <= 768;
  }

  toggleDetails(): void {
    this.isDetailsOpen = !this.isDetailsOpen;
  }

  private loadSpecialities(): void {
    if (typeof this.hospital?.hospitalId !== 'number') {
      console.error('No hospital ID available or invalid ID type');
      this.error = 'Ошибка: данные о больнице отсутствуют';
      return;
    }

    console.log('Loading specialities for hospital ID:', this.hospital.hospitalId);
    this.loading = true;
    this.error = null;

    this.orderService.getSpecialities(this.hospital.hospitalId).subscribe({
      next: (specialities) => {
        console.log('Loaded specialities:', specialities);
        this.specialities = specialities;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading specialities:', error);
        this.error = 'Ошибка при загрузке специальностей';
        this.loading = false;
      }
    });
  }

  loadDoctors(specialityId: number): void {
    if (!this.hospital) return;
    
    this.loading = true;
    this.orderService.getDoctorsBySpecialityAndHospital(this.hospital.hospitalId, specialityId)
      .subscribe({
        next: (doctors: DoctorDetails[]) => {
          console.log('Loaded doctors:', doctors);
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading doctors:', error);
          this.error = 'Ошибка при загрузке списка врачей';
          this.loading = false;
        }
      });
  }

  selectSpeciality(speciality: Speciality): void {
    this.router.navigate(['/order/doctor'], {
      state: { 
        hospital: this.hospital,
        speciality: speciality
      }
    });
  }

  // Вспомогательный метод для разбивки массива на чанки
  getChunks(arr: any[], size: number): any[][] {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  getWorkingHours(day: string): string {
    if (!this.hospital?.workingHours) return '';
    
    // Если круглосуточно
    if (this.hospital.workingHours.toLowerCase().includes('круглосуточно')) {
      return 'круглосуточно';
    }

    // Разбиваем строку по запятым и ищем нужный день
    const schedules = this.hospital.workingHours.split(',');
    const daySchedule = schedules.find(schedule => 
      schedule.trim().startsWith(day)
    );
    
    if (daySchedule) {
      // Используем регулярное выражение для извлечения времени
      const timeMatch = daySchedule.match(/(?:ПН-ПТ|СБ):\s*([\d:-]+)/);
      return timeMatch ? timeMatch[1].trim() : '';
    }

    return '';
  }

  getPhones(): PhoneItem[] {
    if (!this.hospital?.phones) return [];
    
    const result: PhoneItem[] = [];
    const sections = this.hospital.phones.split(/(?=(?:Регистратура:|Женская консультация:|Стоматология:|Студенческая деревня:))/);
    
    sections.forEach(section => {
      if (!section.trim()) return;
      
      // Разбиваем секцию на метку и номера
      const [label, ...numbers] = section.split(/(?=\+)/);
      
      if (label.trim()) {
        // Добавляем метку как некликабельный элемент
        result.push({ isLabel: true, text: label.trim() });
      }
      
      // Добавляем каждый номер как кликабельный элемент
      numbers.forEach(number => {
        if (number.trim()) {
          result.push({ isLabel: false, text: number.trim() });
        }
      });
    });
    
    return result;
  }

  getDomain(url: string | undefined): string {
    if (!url) return '';
    return url.replace(/^https?:\/\//, '');
  }
}
