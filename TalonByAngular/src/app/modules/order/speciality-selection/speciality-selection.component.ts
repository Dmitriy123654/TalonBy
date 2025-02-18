import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Hospital } from '../../../interfaces/order.interface';
import { OrderService } from '../../../services/order.service';

interface Speciality {
  id: number;
  name: string;
  link: string;
}

@Component({
  selector: 'app-speciality-selection',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './speciality-selection.component.html',
  styleUrl: './speciality-selection.component.scss'
})
export class SpecialitySelectionComponent implements OnInit {
  hospital: Hospital | null = null;
  specialities: Speciality[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private orderService: OrderService
  ) {
    const state = this.router.getCurrentNavigation()?.extras.state;
    if (state && 'hospital' in state) {
      this.hospital = state['hospital'];
      console.log('Received hospital in constructor:', this.hospital);
    }
  }

  ngOnInit(): void {
    if (!this.hospital || typeof this.hospital.hospitalId !== 'number') {
      console.warn('No hospital data or invalid hospital ID:', this.hospital);
      this.router.navigate(['/order']);
      return;
    }
    this.loadSpecialities();
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
    this.orderService.getDoctorsBySpecialty(this.hospital.hospitalId, specialityId).subscribe({
      next: (doctors) => {
        console.log('Loaded doctors:', doctors);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.error = 'Ошибка при загрузке списка врачей';
        this.loading = false;
      }
    });
  }

  selectSpeciality(speciality: Speciality): void {
    this.loadDoctors(speciality.id);
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
}
