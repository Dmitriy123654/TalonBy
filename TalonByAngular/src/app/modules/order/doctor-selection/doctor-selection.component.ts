import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Hospital, DoctorDetails } from '../../../shared/interfaces/order.interface';
import { OrderService } from '../../../core/services/order.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PhoneItem {
  isLabel: boolean;
  text: string;
}

@Component({
  selector: 'app-doctor-selection',
  templateUrl: './doctor-selection.component.html',
  styleUrls: ['./doctor-selection.component.scss']
})
export class DoctorSelectionComponent implements OnInit, OnDestroy {
  hospital: Hospital | null = null;
  specialityId: number | null = null;
  isMobile = false;
  isDetailsOpen = false;
  loading = false;
  error: string | null = null;
  doctors: DoctorDetails[] = [];
  
  constructor(
    private router: Router,
    private orderService: OrderService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    console.log('Received state:', state);
    if (state) {
      this.hospital = state['hospital'];
      const speciality = state['speciality'];
      this.specialityId = speciality?.id;
      console.log('Set specialityId:', this.specialityId);
    }
    this.checkScreenSize();
  }

  ngOnInit(): void {
    if (!this.hospital) {
      this.router.navigate(['/order']);
      return;
    }
    
    window.addEventListener('resize', this.checkScreenSize.bind(this));
    this.loadDoctors();
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

  selectDoctor(doctor: DoctorDetails): void {
    console.log('Selecting doctor:', doctor);
    this.router.navigate(['/order/datetime'], {
      state: { 
        hospital: this.hospital,
        doctor: doctor
      }
    });
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

  goBack(): void {
    this.router.navigate(['/order/speciality'], {
      state: { hospital: this.hospital }
    });
  }

  private loadDoctors(): void {
    if (!this.hospital?.hospitalId) return;
    
    this.loading = true;
    this.error = null;

    if (this.specialityId) {
      // Если есть ID специальности, загружаем врачей по специальности и больнице
      this.orderService.getDoctorsBySpecialityAndHospital(this.hospital.hospitalId, this.specialityId)
        .subscribe({
          next: (doctors) => {
            this.doctors = doctors;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading doctors:', error);
            this.error = 'Ошибка при загрузке списка врачей';
            this.loading = false;
          }
        });
    } else {
      // Иначе загружаем всех врачей больницы
      this.orderService.getDoctorsByHospital(this.hospital.hospitalId)
        .subscribe({
          next: (doctors) => {
            this.doctors = doctors;
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading doctors:', error);
            this.error = 'Ошибка при загрузке списка врачей';
            this.loading = false;
          }
        });
    }
  }
}
