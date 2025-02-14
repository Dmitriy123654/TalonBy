import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Hospital, Department, Doctor, TimeSlot } from '../../interfaces/order.interface';

@Component({
  selector: 'app-order',
  templateUrl: './order.component.html',
  styleUrls: ['./order.component.scss']
})
export class OrderComponent implements OnInit {
  orderForm: FormGroup;
  hospitals: Hospital[] = [];
  departments: Department[] = [];
  doctors: Doctor[] = [];
  timeSlots: TimeSlot[] = [];
  isLoading = false;
  today = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService
  ) {
    this.orderForm = this.fb.group({
      hospitalId: ['', Validators.required],
      departmentId: ['', Validators.required],
      doctorId: ['', Validators.required],
      date: ['', Validators.required],
      timeSlotId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadHospitals();
    
    // Подписываемся на изменения выбора больницы
    this.orderForm.get('hospitalId')?.valueChanges.subscribe(hospitalId => {
      if (hospitalId) {
        this.loadDepartments(hospitalId);
        this.orderForm.patchValue({
          departmentId: '',
          doctorId: '',
          timeSlotId: ''
        });
      }
    });

    // Подписываемся на изменения выбора отделения
    this.orderForm.get('departmentId')?.valueChanges.subscribe(departmentId => {
      if (departmentId) {
        this.loadDoctors(departmentId);
        this.orderForm.patchValue({
          doctorId: '',
          timeSlotId: ''
        });
      }
    });

    // Подписываемся на изменения выбора врача и даты
    this.orderForm.get('doctorId')?.valueChanges.subscribe(() => this.loadTimeSlots());
    this.orderForm.get('date')?.valueChanges.subscribe(() => this.loadTimeSlots());
  }

  private loadHospitals(): void {
    this.isLoading = true;
    this.orderService.getHospitals().subscribe({
      next: (hospitals) => {
        this.hospitals = hospitals;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading hospitals:', error);
        this.isLoading = false;
      }
    });
  }

  private loadDepartments(hospitalId: number): void {
    this.isLoading = true;
    this.orderService.getDepartments(hospitalId).subscribe({
      next: (departments) => {
        this.departments = departments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.isLoading = false;
      }
    });
  }

  private loadDoctors(departmentId: number): void {
    this.isLoading = true;
    this.orderService.getDoctors(departmentId).subscribe({
      next: (doctors) => {
        this.doctors = doctors;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.isLoading = false;
      }
    });
  }

  private loadTimeSlots(): void {
    const doctorId = this.orderForm.get('doctorId')?.value;
    const date = this.orderForm.get('date')?.value;
    
    if (doctorId && date) {
      this.isLoading = true;
      this.orderService.getTimeSlots(doctorId, date).subscribe({
        next: (timeSlots) => {
          this.timeSlots = timeSlots;
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading time slots:', error);
          this.isLoading = false;
        }
      });
    }
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      this.isLoading = true;
      const formData = this.orderForm.value;
      
      this.orderService.createAppointment({
        patientId: 1, // Здесь должен быть ID текущего пользователя
        doctorId: formData.doctorId,
        timeSlotId: formData.timeSlotId,
        status: 'pending'
      }).subscribe({
        next: (appointment) => {
          console.log('Appointment created:', appointment);
          this.isLoading = false;
          // Добавить обработку успешного создания записи
        },
        error: (error) => {
          console.error('Error creating appointment:', error);
          this.isLoading = false;
          // Добавить обработку ошибки
        }
      });
    }
  }
} 