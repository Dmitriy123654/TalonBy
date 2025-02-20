import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Hospital, DoctorDetails } from '../../../interfaces/order.interface';

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
  isMobile = false;
  isDetailsOpen = false;
  
  // Тестовые данные
  doctors: DoctorDetails[] = [
    {
      id: 1,
      name: 'Иванов Иван Иванович',
      speciality: 'Терапевт',
      cabinet: '404',
      photo: 'assets/doctor1.jpg'
    },
    {
      id: 2,
      name: 'Петрова Анна Михайловна',
      speciality: 'Терапевт',
      cabinet: '405'
    },
    {
      id: 3,
      name: 'Сидоров Петр Алексеевич',
      speciality: 'Терапевт',
      cabinet: '406',
      photo: 'assets/doctor2.jpg'
    }
  ];

  constructor(private router: Router) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && 'hospital' in state) {
      this.hospital = state['hospital'];
    }
    this.checkScreenSize();
  }

  ngOnInit(): void {
    if (!this.hospital) {
      this.router.navigate(['/order']);
      return;
    }
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

  selectDoctor(doctor: DoctorDetails): void {
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
    
    sections.forEach(section => {
      if (!section.trim()) return;
      const [label, ...numbers] = section.split(/(?=\+)/);
      if (label.trim()) {
        result.push({ isLabel: true, text: label.trim() });
      }
      numbers.forEach(number => {
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
    const daySchedule = schedules.find(schedule => 
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
}
