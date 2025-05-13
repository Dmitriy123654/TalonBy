import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HospitalService } from '../../../core/services/hospital.service';
import { AuthService } from '../../../core/services/auth.service';
import { Hospital, HospitalType } from '../../../shared/interfaces/hospital.interface';

@Component({
  selector: 'app-hospital-management',
  templateUrl: './hospital-management.component.html',
  styleUrls: ['./hospital-management.component.scss']
})
export class HospitalManagementComponent implements OnInit {
  hospitals: Hospital[] = [];
  filteredHospitals: Hospital[] = [];
  selectedHospital: Hospital | null = null;
  
  // Фильтры
  searchQuery: string = '';
  selectedHospitalType: HospitalType | null = null;
  // Поле для поиска
  searchField: string = 'all'; // по умолчанию поиск по всем полям
  searchFields = [
    { value: 'all', label: 'Все поля' },
    { value: 'name', label: 'Название' },
    { value: 'address', label: 'Адрес' },
    { value: 'phones', label: 'Телефоны' },
    { value: 'email', label: 'Email' }
  ];
  
  hospitalForm: FormGroup;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Состояние отображения
  showHospitalList = true;
  showHospitalDetails = false;
  showHospitalModal = false;
  
  // Типы больниц
  hospitalTypes = HospitalType;
  hospitalTypesArray = Object.values(HospitalType);
  
  // Роль пользователя
  userRole: string = 'Administrator'; // По умолчанию Administrator
  
  constructor(
    private hospitalService: HospitalService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.hospitalForm = this.fb.group({
      hospitalId: [null],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      address: ['', [Validators.required, Validators.maxLength(500)]],
      type: ['', Validators.required],
      workingHours: ['', [Validators.required, Validators.maxLength(200)]],
      phones: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(1000)]]
    });
  }

  ngOnInit(): void {
    // Получаем информацию о пользователе для фильтрации на основе роли
    const userInfo = this.authService.getUserInfo();
    this.userRole = userInfo?.role || 'Administrator';
    
    // Загружаем начальные данные
    this.loadHospitals();
  }
  
  // Возвращает человекочитаемое название типа больницы
  getHospitalTypeDisplay(type: any): string {
    switch(Number(type)) {
      case 0:
      case HospitalType.Adult: return 'Взрослое';
      case 1: 
      case HospitalType.Children: return 'Детское';
      case 2:
      case HospitalType.Specialized: return 'Специализированное';
      default: return String(type); // Возвращаем оригинальное значение как строку
    }
  }
  
  // Загрузка списка больниц
  loadHospitals(): void {
    this.isLoading = true;
    this.resetMessages();
    
    this.hospitalService.getHospitals().subscribe({
      next: (data) => {
        this.hospitals = data;
        this.filteredHospitals = [...this.hospitals];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Ошибка загрузки больниц:', error);
        this.errorMessage = 'Не удалось загрузить список больниц. Пожалуйста, попробуйте позже.';
        this.isLoading = false;
      }
    });
  }
  
  // Сброс фильтров
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedHospitalType = null;
    this.searchField = 'all';
    this.filteredHospitals = [...this.hospitals];
  }
  
  // Применение фильтров
  applyFilters(): void {
    let filtered = [...this.hospitals];
    
    // Поиск по названию, адресу или телефонам
    if (this.searchQuery.trim()) {
      const searchTerms = this.searchQuery.toLowerCase().trim().split(/\s+/);
      
      filtered = filtered.filter(hospital => {
        // Если выбран поиск по определенному полю
        if (this.searchField !== 'all') {
          let fieldValue = '';
          // Получаем значение выбранного поля безопасным способом
          switch(this.searchField) {
            case 'name':
              fieldValue = (hospital.name || '').toLowerCase();
              break;
            case 'address':
              fieldValue = (hospital.address || '').toLowerCase();
              break;
            case 'phones':
              fieldValue = (hospital.phones || '').toLowerCase();
              break;
            case 'email':
              fieldValue = (hospital.email || '').toLowerCase();
              break;
            default:
              fieldValue = '';
          }
          return searchTerms.every(term => fieldValue.includes(term));
        } else {
          // Поиск по всем полям
          const name = (hospital.name || '').toLowerCase();
          const address = (hospital.address || '').toLowerCase();
          const phones = (hospital.phones || '').toLowerCase();
          const email = (hospital.email || '').toLowerCase();
          const description = (hospital.description || '').toLowerCase();
          const allText = `${name} ${address} ${phones} ${email} ${description}`;
          
          return searchTerms.every(term => allText.includes(term));
        }
      });
    }
    
    // Фильтр по типу больницы
    if (this.selectedHospitalType !== null) {
      filtered = filtered.filter(hospital => 
        hospital.type === this.selectedHospitalType
      );
    }
    
    this.filteredHospitals = filtered;
  }
  
  // Просмотр деталей больницы
  viewHospitalDetails(hospital: Hospital): void {
    this.selectedHospital = hospital;
    this.showHospitalList = false;
    this.showHospitalDetails = true;
  }
  
  // Возврат к списку больниц
  backToHospitalList(): void {
    this.showHospitalList = true;
    this.showHospitalDetails = false;
    this.selectedHospital = null;
  }
  
  // Открытие модального окна для добавления/редактирования больницы
  openHospitalModal(hospital?: Hospital): void {
    this.resetMessages();
    
    if (hospital) {
      // Редактирование существующей больницы
      this.hospitalForm.patchValue({
        hospitalId: hospital.hospitalId,
        name: hospital.name,
        address: hospital.address,
        type: hospital.type,
        workingHours: hospital.workingHours,
        phones: hospital.phones,
        email: hospital.email || '',
        description: hospital.description || ''
      });
    } else {
      // Добавление новой больницы
      this.hospitalForm.reset({
        hospitalId: null,
        type: HospitalType.Adult // Значение по умолчанию
      });
    }
    
    this.showHospitalModal = true;
  }
  
  // Сохранение больницы (добавление или обновление)
  saveHospital(): void {
    if (this.hospitalForm.invalid) {
      this.markFormGroupTouched(this.hospitalForm);
      return;
    }
    
    this.isLoading = true;
    this.resetMessages();
    
    const formValue = this.hospitalForm.value;
    const hospitalId = formValue.hospitalId;
    
    // Удаляем hospitalId из объекта для отправки на сервер
    const hospitalData: Omit<Hospital, 'hospitalId'> = {
      name: formValue.name,
      address: formValue.address,
      type: formValue.type,
      workingHours: formValue.workingHours,
      phones: formValue.phones,
      email: formValue.email,
      description: formValue.description
    };
    
    if (hospitalId) {
      // Обновление существующей больницы
      this.hospitalService.updateHospital(hospitalId, hospitalData).subscribe({
        next: () => {
          this.successMessage = 'Больница успешно обновлена';
          this.loadHospitalsAndUpdateUI(hospitalId);
        },
        error: (error) => {
          console.error('Ошибка обновления больницы:', error);
          this.errorMessage = 'Не удалось обновить больницу. Пожалуйста, попробуйте позже.';
          this.isLoading = false;
        }
      });
    } else {
      // Создание новой больницы
      this.hospitalService.createHospital(hospitalData).subscribe({
        next: () => {
          this.successMessage = 'Больница успешно добавлена';
          this.loadHospitalsAndUpdateUI();
        },
        error: (error) => {
          console.error('Ошибка создания больницы:', error);
          this.errorMessage = 'Не удалось создать больницу. Пожалуйста, попробуйте позже.';
          this.isLoading = false;
        }
      });
    }
  }
  
  // Загрузка обновленного списка больниц и обновление UI
  loadHospitalsAndUpdateUI(hospitalId?: number): void {
    this.hospitalService.getHospitals().subscribe({
      next: (hospitals) => {
        this.hospitals = hospitals;
        this.applyFilters();
        
        // Если был передан ID больницы, находим её в обновленном списке
        if (hospitalId) {
          const updatedHospital = hospitals.find(h => h.hospitalId === hospitalId);
          if (updatedHospital && this.selectedHospital) {
            this.selectedHospital = updatedHospital;
          }
        }
        
        this.isLoading = false;
        this.showHospitalModal = false;
      },
      error: (error) => {
        console.error('Ошибка загрузки обновленного списка больниц:', error);
        this.errorMessage = 'Больница была сохранена, но не удалось обновить список. Пожалуйста, обновите страницу.';
        this.isLoading = false;
        this.showHospitalModal = false;
      }
    });
  }
  
  // Удаление больницы
  deleteHospital(hospitalId: number): void {
    if (!confirm('Вы уверены, что хотите удалить эту больницу?')) {
      return;
    }
    
    this.isLoading = true;
    this.resetMessages();
    
    this.hospitalService.deleteHospital(hospitalId).subscribe({
      next: () => {
        this.successMessage = 'Больница успешно удалена';
        
        // Обновляем список и возвращаемся к нему
        this.hospitals = this.hospitals.filter(h => h.hospitalId !== hospitalId);
        this.filteredHospitals = this.filteredHospitals.filter(h => h.hospitalId !== hospitalId);
        
        this.showHospitalList = true;
        this.showHospitalDetails = false;
        this.selectedHospital = null;
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Ошибка удаления больницы:', error);
        this.errorMessage = 'Не удалось удалить больницу. Пожалуйста, попробуйте позже.';
        this.isLoading = false;
      }
    });
  }
  
  // Закрытие модального окна
  closeHospitalModal(): void {
    this.showHospitalModal = false;
  }
  
  // Сброс сообщений об ошибках и успехе
  resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
  
  // Помечает все поля формы как "посещенные" для отображения ошибок валидации
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
} 