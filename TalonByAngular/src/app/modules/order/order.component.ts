import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { OrderService } from '../../core/services/order.service';
import { 
  Hospital, 
  Department, 
  Doctor, 
  TimeSlot, 
  HospitalType, 
  DoctorDetails, 
  Speciality 
} from '../../shared/interfaces/order.interface';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

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

  filteredHospitals: Hospital[] = [];
  searchTerm: string = '';
  selectedTypes: HospitalType[] = [];
  
  hospitalTypes = [
    { id: HospitalType.Adult, name: 'Взрослая' },
    { id: HospitalType.Children, name: 'Детская' },
    { id: HospitalType.Specialized, name: 'Специализированная' }
  ];

  searchControl = new FormControl('');
  selectedHospitalId: number | null = null;

  specialities: Speciality[] = [];

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private router: Router
  ) {
    this.orderForm = this.fb.group({
      hospitalId: ['', Validators.required],
      specialityId: ['', Validators.required],
      doctorId: ['', Validators.required],
      date: ['', Validators.required],
      timeSlotId: ['', Validators.required],
      searchTerm: ['']
    });
  }

  ngOnInit(): void {
    this.loadHospitals();
    this.loadSpecialities();
    
    // Подписываемся на изменения выбора специальности
    this.orderForm.get('specialityId')?.valueChanges.subscribe(specialityId => {
      if (specialityId && specialityId !== 'undefined' && specialityId !== '') {
        this.loadDoctorsBySpeciality(Number(specialityId));
        this.orderForm.patchValue({
          doctorId: '',
          timeSlotId: ''
        });
      } else {
        this.doctors = [];
      }
    });

    // Подписываемся на изменения выбора врача и даты
    this.orderForm.get('doctorId')?.valueChanges.subscribe(() => this.loadTimeSlots());
    this.orderForm.get('date')?.valueChanges.subscribe(() => this.loadTimeSlots());

    // Подписка на изменение поискового запроса
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filterHospitals();
    });
  }

  private loadHospitals(): void {
    this.isLoading = true;
    console.log('Loading hospitals...');
    this.orderService.getHospitals().subscribe({
      next: (hospitals) => {
        console.log('Received hospitals:', hospitals);
        this.hospitals = hospitals;
        this.filterHospitals();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading hospitals:', error);
        this.hospitals = [];
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

  private loadSpecialities(): void {
    if (!this.selectedHospitalId) return;
    
    this.isLoading = true;
    this.orderService.getSpecialities(this.selectedHospitalId).subscribe({
      next: (specialities) => {
        console.log('Received specialities:', specialities);
        if (Array.isArray(specialities)) {
          this.specialities = specialities;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading specialities:', error);
        this.isLoading = false;
      }
    });
  }

  private loadDoctorsBySpeciality(specialityId: number): void {
    if (!specialityId || isNaN(specialityId)) {
      this.doctors = [];
      return;
    }

    if (!this.selectedHospitalId) {
      console.warn('No hospital selected');
      return;
    }

    this.isLoading = true;
    this.orderService.getDoctorsBySpecialityAndHospital(this.selectedHospitalId, specialityId)
      .subscribe({
        next: (doctors: DoctorDetails[]) => {
          console.log('Received doctors:', doctors);
          if (Array.isArray(doctors)) {
            // Преобразуем DoctorDetails в Doctor
            this.doctors = doctors.map(doctor => ({
              id: doctor.doctorId,
              name: doctor.fullName,
              specialityId: doctor.doctorsSpecialityId,
              schedule: {
                start: doctor.workingHours,
                end: doctor.workingHours
              }
            }));
          } else {
            console.warn('Received non-array response:', doctors);
            this.doctors = [];
          }
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('Error loading doctors:', error);
          this.doctors = [];
          this.isLoading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.orderForm.valid) {
      const formData = this.orderForm.value;
      this.orderService.createAppointment({
        hospitalId: formData.hospitalId,
        departmentId: formData.departmentId,
        doctorId: formData.doctorId,
        timeSlotId: formData.timeSlotId,
        patientId: 1,
        status: 'pending'
      }).subscribe({
        next: (response) => {
          console.log('Appointment created:', response);
          // Добавьте здесь логику успешного создания записи
        },
        error: (error) => {
          console.error('Error creating appointment:', error);
          // Добавьте здесь обработку ошибки
        }
      });
    }
  }

  onTypeChange(type: HospitalType): void {
    const index = this.selectedTypes.indexOf(type);
    if (index === -1) {
      this.selectedTypes.push(type);
    } else {
      this.selectedTypes.splice(index, 1);
    }
    this.filterHospitals();
  }

  private filterHospitals(): void {
    const searchTerm = this.searchControl.value || '';
    
    // Создаем регулярное выражение из поискового запроса
    // 'i' флаг для игнорирования регистра
    // Экранируем специальные символы
    const searchRegex = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    this.filteredHospitals = this.hospitals.filter(hospital => {
      const matchesSearch = searchRegex.test(hospital.name); // Ищем только по имени
      const matchesType = this.selectedTypes.length === 0 || 
                         this.selectedTypes.includes(hospital.type);
      
      return matchesSearch && matchesType;
    });
  }

  selectHospital(hospital: Hospital): void {
    if (!hospital || typeof hospital.hospitalId !== 'number') {
      console.error('Invalid hospital data:', hospital);
      return;
    }

    // Очищаем объект больницы от ненужных полей перед передачей
    const cleanHospital = {
      hospitalId: hospital.hospitalId,
      name: hospital.name,
      address: hospital.address,
      type: hospital.type,
      workingHours: hospital.workingHours,
      phones: hospital.phones,
      email: hospital.email,
      description: hospital.description
    };

    console.log('Selecting hospital:', cleanHospital);
    this.selectedHospitalId = hospital.hospitalId;
    
    // Переход на следующую страницу с передачей данных
    this.router.navigate(['/order/speciality'], {
      state: { hospital: cleanHospital }
    }).then(() => {
      console.log('Navigation completed with hospital ID:', hospital.hospitalId);
    }).catch(error => {
      console.error('Navigation error:', error);
    });
  }
} 