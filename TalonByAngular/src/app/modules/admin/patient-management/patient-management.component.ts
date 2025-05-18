import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { PatientCardService } from '../../../core/services/patient-card.service';
import { AuthService } from '../../../core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-patient-management',
  templateUrl: './patient-management.component.html',
  styleUrls: ['./patient-management.component.scss']
})
export class PatientManagementComponent implements OnInit, OnChanges {
  @Input() patientIdParam: string | null = null;
  @Input() returnUrlParam: string | null = null;
  
  patients: any[] = [];
  filteredPatients: any[] = [];
  selectedPatient: any = null;
  selectedPatientCard: any = null;
  
  searchForm: FormGroup;
  allergyForm: FormGroup;
  patientCardForm: FormGroup;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Состояние отображения
  showPatientList = true;
  showPatientDetails = false;
  showAllergyModal = false;
  showPatientCardModal = false;
  editingAllergy: any = null;
  
  // Типы крови для выбора
  bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  
  // Add this after other form-related properties
  showBloodTypeModal = false;
  bloodTypeForm: FormGroup;
  
  // Add these properties
  showChronicConditionModal = false;
  showImmunizationModal = false;
  editingChronicCondition: any = null;
  editingImmunization: any = null;
  chronicConditionForm: FormGroup;
  immunizationForm: FormGroup;
  today = new Date().toISOString().split('T')[0]; // Used to limit date inputs
  minDate = '1980-01-01'; // Minimum date for validation
  
  // Patient edit form
  patientEditForm: FormGroup;
  isPatientFormSubmitted: boolean = false;
  showPatientEditModal: boolean = false;
  
  // Для возврата на предыдущую страницу
  returnUrl: string | null = null;
  
  constructor(
    private patientService: PatientService,
    private patientCardService: PatientCardService,
    private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      searchText: [''],
      filterBy: ['name'] // name, gender, dateOfBirth
    });
    
    this.allergyForm = this.fb.group({
      allergyName: ['', [Validators.required, Validators.maxLength(100)]],
      severity: ['Low', Validators.required]
    });
    
    this.patientCardForm = this.fb.group({
      bloodType: ['O+', Validators.required]
    });

    // Add this for blood type editing
    this.bloodTypeForm = this.fb.group({
      bloodType: ['', Validators.required]
    });

    // Add these for chronic conditions and immunizations
    this.chronicConditionForm = this.fb.group({
      conditionName: ['', [Validators.required, Validators.maxLength(200)]],
      diagnosedDate: [
        this.today, 
        [
          Validators.required,
          this.dateRangeValidator(new Date(this.minDate), new Date())
        ]
      ]
    });

    this.immunizationForm = this.fb.group({
      vaccineName: ['', [Validators.required, Validators.maxLength(150)]],
      vaccinationDate: [
        this.today, 
        [
          Validators.required,
          this.dateRangeValidator(new Date(this.minDate), new Date())
        ]
      ]
    });

    // Add patient edit form
    this.patientEditForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      gender: ['0'],
      dateOfBirth: ['', [
        Validators.required,
        this.dateRangeValidator(new Date('1900-01-01'), new Date())
      ]],
      address: ['', Validators.maxLength(200)]
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    
    // Проверяем параметры запроса для прямого перехода к карточке пациента
    this.route.queryParams.subscribe(params => {
      const patientId = params['patientId'];
      this.returnUrl = params['returnUrl'];
      
      if (patientId) {
        // Если указан ID пациента, загружаем его данные
        this.loadPatientById(parseInt(patientId, 10));
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Реагируем на изменения входных параметров
    if (changes['patientIdParam'] && this.patientIdParam) {
      this.loadPatientById(parseInt(this.patientIdParam, 10));
      this.returnUrl = this.returnUrlParam;
    }
  }

  loadPatients(): void {
    this.isLoading = true;
    console.log('Запрос пациентов по URL:', `${this.patientService.getAllPatients()}`);
    this.patientService.getAllPatients().subscribe({
      next: (data) => {
        console.log('Получены данные о пациентах:', data);
        this.patients = Array.isArray(data) ? data : [];
        this.filteredPatients = [...this.patients];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patients:', error);
        this.errorMessage = `Ошибка при загрузке списка пациентов: ${error.status} ${error.statusText}`;
        this.isLoading = false;
        this.patients = [];
        this.filteredPatients = [];
      }
    });
  }

  applyFilter(): void {
    const searchText = this.searchForm.get('searchText')?.value?.toLowerCase() || '';
    const filterBy = this.searchForm.get('filterBy')?.value || 'name';
    
    if (!searchText) {
      this.filteredPatients = [...this.patients];
      return;
    }
    
    this.filteredPatients = this.patients.filter(patient => {
      switch (filterBy) {
        case 'name':
          return (patient.name || '').toLowerCase().includes(searchText);
        case 'gender':
          return this.getGenderDisplayName(patient.gender).toLowerCase().includes(searchText);
        case 'dateOfBirth':
          if (!patient.dateOfBirth) return false;
          try {
            const dob = new Date(patient.dateOfBirth).toLocaleDateString();
            return dob.includes(searchText);
          } catch (e) {
            return false;
          }
        default:
          return (patient.name || '').toLowerCase().includes(searchText);
      }
    });
  }

  // Helper method to convert gender value to display text
  getGenderDisplayName(gender: number): string {
    if (gender === undefined || gender === null) return '';
    
    // Convert numeric gender to string
    switch(gender) {
      case 0: return 'Мужской';
      case 1: return 'Женский';
      default: return `Пол ${gender}`;
    }
  }

  viewPatientDetails(patient: any): void {
    this.selectedPatient = patient;
    this.loadPatientCard(patient.patientId);
    this.showPatientList = false;
    this.showPatientDetails = true;
  }

  loadPatientCard(patientId: number): void {
    this.isLoading = true;
    this.patientCardService.getPatientCardByPatientId(patientId).subscribe({
      next: (data) => {
        console.log('Загружена карточка пациента:', data);
        this.selectedPatientCard = data;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading patient card:', error);
        if (error.status === 404) {
          console.log('Карточка не найдена, предлагаем создать новую');
          this.selectedPatientCard = null;
          
          if (this.selectedPatient) {
            this.openPatientCardModal();
          }
        } else {
          this.errorMessage = `Ошибка при загрузке карточки пациента: ${error.status} ${error.statusText}`;
        }
        this.isLoading = false;
      }
    });
  }

  openPatientCardModal(): void {
    if (!this.selectedPatient) return;
    
    // Create patient card directly instead of showing the modal
    const newPatientCard = {
      patientId: this.selectedPatient.patientId,
      bloodType: 'O+', // Set default blood type instead of null
      patientName: this.selectedPatient.name,
      patientGender: this.selectedPatient.gender || 'Male'
    };
    
    console.log('Автоматически создаем карточку пациента:', newPatientCard);
    
    this.isLoading = true;
    this.patientCardService.createPatientCard(newPatientCard).subscribe({
      next: (data) => {
        console.log('Создана карточка пациента:', data);
        this.selectedPatientCard = data;
        this.successMessage = 'Карточка пациента успешно создана.';
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error creating patient card:', error);
        this.errorMessage = `Ошибка при создании карточки пациента: ${error.status} ${error.statusText}`;
        if (error.error && typeof error.error === 'string') {
          this.errorMessage += ` - ${error.error}`;
        }
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 5000);
      }
    });
  }

  cancelPatientCardCreation(): void {
    this.showPatientCardModal = false;
    this.patientCardForm.reset({
      bloodType: 'O+'
    });
  }

  // Создание карточки пациента с данными из формы
  createPatientCard(): void {
    if (this.patientCardForm.invalid || !this.selectedPatient) return;
    
    const formValues = this.patientCardForm.value;
    
    const newPatientCard = {
      patientCardId: 0,
      patientId: this.selectedPatient.patientId,
      bloodType: formValues.bloodType || 'O+',
      lastUpdate: new Date()
    };
    
    this.isLoading = true;
    this.patientCardService.createPatientCard(newPatientCard).subscribe({
      next: (createdCard) => {
        console.log('Created patient card:', createdCard);
        this.selectedPatientCard = createdCard;
        this.showPatientCardModal = false;
        this.successMessage = 'Медицинская карта успешно создана';
        setTimeout(() => this.successMessage = '', 3000);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error creating patient card:', error);
        this.errorMessage = 'Ошибка при создании медицинской карты';
        setTimeout(() => this.errorMessage = '', 3000);
        this.isLoading = false;
      }
    });
  }

  updatePatientCard(patientCard: any): void {
    this.isLoading = true;
    this.patientCardService.updatePatientCard(patientCard).subscribe({
      next: () => {
        this.successMessage = 'Карточка пациента успешно обновлена.';
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating patient card:', error);
        this.errorMessage = `Ошибка при обновлении карточки пациента: ${error.status} ${error.statusText}`;
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  // Методы для аллергий
  openAllergyModal(allergy?: any): void {
    this.editingAllergy = allergy || null;
    
    if (allergy) {
      this.allergyForm.patchValue({
        allergyName: allergy.allergyName,
        severity: allergy.severity
      });
    } else {
      this.allergyForm.reset({ severity: 'Low' });
    }
    
    this.showAllergyModal = true;
  }
  
  cancelAllergyEdit(): void {
    this.showAllergyModal = false;
    this.editingAllergy = null;
    this.allergyForm.reset({ severity: 'Low' });
  }
  
  saveAllergy(): void {
    if (this.allergyForm.invalid) return;
    
    const formValues = this.allergyForm.value;
    
    if (this.editingAllergy) {
      const updatedAllergy = {
        ...this.editingAllergy,
        allergyName: formValues.allergyName,
        severity: formValues.severity
      };
      
      this.updateAllergy(updatedAllergy);
    } else {
      const newAllergy = {
        patientCardId: this.selectedPatientCard.patientCardId,
        allergyName: formValues.allergyName,
        severity: formValues.severity
      };
      
      this.addAllergy(newAllergy);
    }
    
    this.showAllergyModal = false;
  }

  addAllergy(allergy: any): void {
    if (!this.selectedPatientCard) return;
    
    this.isLoading = true;
    this.patientCardService.addAllergy(this.selectedPatientCard.patientCardId, allergy).subscribe({
      next: (data) => {
        if (!this.selectedPatientCard.allergies) {
          this.selectedPatientCard.allergies = [];
        }
        this.selectedPatientCard.allergies.push(data);
        this.successMessage = 'Аллергия успешно добавлена.';
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error adding allergy:', error);
        this.errorMessage = 'Ошибка при добавлении аллергии.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  updateAllergy(allergy: any): void {
    this.isLoading = true;
    this.patientCardService.updateAllergy(allergy).subscribe({
      next: () => {
        if (this.selectedPatientCard && this.selectedPatientCard.allergies) {
          const index = this.selectedPatientCard.allergies.findIndex(
            (a: any) => a.allergyId === allergy.allergyId
          );
          if (index !== -1) {
            this.selectedPatientCard.allergies[index] = allergy;
          }
        }
        this.successMessage = 'Информация об аллергии успешно обновлена.';
        this.isLoading = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating allergy:', error);
        this.errorMessage = 'Ошибка при обновлении информации об аллергии.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }

  deleteAllergy(allergyId: number): void {
    if (confirm('Вы уверены, что хотите удалить эту аллергию?')) {
      this.isLoading = true;
      this.patientCardService.deleteAllergy(allergyId).subscribe({
        next: () => {
          if (this.selectedPatientCard && this.selectedPatientCard.allergies) {
            this.selectedPatientCard.allergies = this.selectedPatientCard.allergies.filter(
              (a: any) => a.allergyId !== allergyId
            );
          }
          this.successMessage = 'Аллергия успешно удалена.';
          this.isLoading = false;
          setTimeout(() => this.successMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error deleting allergy:', error);
          this.errorMessage = 'Ошибка при удалении аллергии.';
          this.isLoading = false;
          setTimeout(() => this.errorMessage = '', 3000);
        }
      });
    }
  }

  // Методы для хронических заболеваний
  openChronicConditionModal(condition?: any): void {
    this.editingChronicCondition = condition || null;
    
    if (condition) {
      this.chronicConditionForm.patchValue({
        conditionName: condition.conditionName,
        diagnosedDate: new Date(condition.diagnosedDate).toISOString().split('T')[0]
      });
    } else {
      this.chronicConditionForm.reset({ diagnosedDate: this.today });
    }
    
    this.showChronicConditionModal = true;
  }
  
  cancelChronicConditionEdit(): void {
    this.showChronicConditionModal = false;
    this.editingChronicCondition = null;
    this.chronicConditionForm.reset({ diagnosedDate: this.today });
  }
  
  saveChronicCondition(): void {
    if (this.chronicConditionForm.invalid) return;
    
    const formValues = this.chronicConditionForm.value;
    
    if (this.editingChronicCondition) {
      const updatedCondition = {
        ...this.editingChronicCondition,
        conditionName: formValues.conditionName,
        diagnosedDate: formValues.diagnosedDate
      };
      
      this.updateChronicCondition(updatedCondition);
    } else {
      const newCondition = {
        patientCardId: this.selectedPatientCard.patientCardId,
        conditionName: formValues.conditionName,
        diagnosedDate: formValues.diagnosedDate
      };
      
      this.addChronicCondition(newCondition);
    }
    
    this.showChronicConditionModal = false;
  }

  // Методы для иммунизаций
  openImmunizationModal(immunization?: any): void {
    this.editingImmunization = immunization || null;
    
    if (immunization) {
      this.immunizationForm.patchValue({
        vaccineName: immunization.vaccineName,
        vaccinationDate: new Date(immunization.vaccinationDate).toISOString().split('T')[0]
      });
    } else {
      this.immunizationForm.reset({ vaccinationDate: this.today });
    }
    
    this.showImmunizationModal = true;
  }
  
  cancelImmunizationEdit(): void {
    this.showImmunizationModal = false;
    this.editingImmunization = null;
    this.immunizationForm.reset({ vaccinationDate: this.today });
  }
  
  saveImmunization(): void {
    if (this.immunizationForm.invalid) return;
    
    const formValues = this.immunizationForm.value;
    
    if (this.editingImmunization) {
      const updatedImmunization = {
        ...this.editingImmunization,
        vaccineName: formValues.vaccineName,
        vaccinationDate: formValues.vaccinationDate
      };
      
      this.updateImmunization(updatedImmunization);
    } else {
      const newImmunization = {
        patientCardId: this.selectedPatientCard.patientCardId,
        vaccineName: formValues.vaccineName,
        vaccinationDate: formValues.vaccinationDate
      };
      
      this.addImmunization(newImmunization);
    }
    
    this.showImmunizationModal = false;
  }

  addImmunization(immunization: any): void {
    if (!this.selectedPatientCard) return;
    
    this.isLoading = true;
    this.patientCardService.addImmunization(this.selectedPatientCard.patientCardId, immunization).subscribe({
      next: (data) => {
        this.successMessage = 'Иммунизация успешно добавлена';
        // Add to the list if it exists
        if (this.selectedPatientCard) {
          if (!this.selectedPatientCard.immunizations) {
            this.selectedPatientCard.immunizations = [];
          }
          this.selectedPatientCard.immunizations.push(data);
        }
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error adding immunization:', error);
        this.errorMessage = `Ошибка при добавлении иммунизации: ${error.message}`;
        this.isLoading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  updateImmunization(immunization: any): void {
    if (!immunization || !this.selectedPatientCard) return;
    
    this.isLoading = true;
    this.patientCardService.updateImmunization(immunization).subscribe({
      next: () => {
        this.successMessage = 'Иммунизация успешно обновлена';
        // Update the immunization in the list
        if (this.selectedPatientCard && this.selectedPatientCard.immunizations) {
          const index = this.selectedPatientCard.immunizations.findIndex(
            (i: any) => i.immunizationId === immunization.immunizationId
          );
          if (index !== -1) {
            this.selectedPatientCard.immunizations[index] = immunization;
          }
        }
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating immunization:', error);
        this.errorMessage = `Ошибка при обновлении иммунизации: ${error.message}`;
        this.isLoading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  deleteImmunization(immunizationId: number): void {
    if (!immunizationId || !this.selectedPatientCard) return;
    
    if (!confirm('Вы уверены, что хотите удалить эту иммунизацию?')) {
      return;
    }
    
    this.isLoading = true;
    this.patientCardService.deleteImmunization(immunizationId).subscribe({
      next: () => {
        this.successMessage = 'Иммунизация успешно удалена';
        // Update the list
        if (this.selectedPatientCard && this.selectedPatientCard.immunizations) {
          this.selectedPatientCard.immunizations = this.selectedPatientCard.immunizations.filter(
            (i: any) => i.immunizationId !== immunizationId
          );
        }
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error deleting immunization:', error);
        this.errorMessage = `Ошибка при удалении иммунизации: ${error.message}`;
        this.isLoading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  addChronicCondition(condition: any): void {
    if (!this.selectedPatientCard) return;
    
    this.isLoading = true;
    this.patientCardService.addChronicCondition(this.selectedPatientCard.patientCardId, condition).subscribe({
      next: (data) => {
        this.successMessage = 'Хроническое заболевание успешно добавлено';
        // Add to the list if it exists
        if (this.selectedPatientCard) {
          if (!this.selectedPatientCard.chronicConditions) {
            this.selectedPatientCard.chronicConditions = [];
          }
          this.selectedPatientCard.chronicConditions.push(data);
        }
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error adding chronic condition:', error);
        this.errorMessage = `Ошибка при добавлении хронического заболевания: ${error.message}`;
        this.isLoading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  updateChronicCondition(condition: any): void {
    if (!condition || !this.selectedPatientCard) return;
    
    this.isLoading = true;
    this.patientCardService.updateChronicCondition(condition).subscribe({
      next: () => {
        this.successMessage = 'Хроническое заболевание успешно обновлено';
        // Update the condition in the list
        if (this.selectedPatientCard && this.selectedPatientCard.chronicConditions) {
          const index = this.selectedPatientCard.chronicConditions.findIndex(
            (c: any) => c.conditionId === condition.conditionId
          );
          if (index !== -1) {
            this.selectedPatientCard.chronicConditions[index] = condition;
          }
        }
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error updating chronic condition:', error);
        this.errorMessage = `Ошибка при обновлении хронического заболевания: ${error.message}`;
        this.isLoading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  deleteChronicCondition(conditionId: number): void {
    if (!conditionId || !this.selectedPatientCard) return;
    
    if (!confirm('Вы уверены, что хотите удалить это хроническое заболевание?')) {
      return;
    }
    
    this.isLoading = true;
    this.patientCardService.deleteChronicCondition(conditionId).subscribe({
      next: () => {
        this.successMessage = 'Хроническое заболевание успешно удалено';
        // Update the list
        if (this.selectedPatientCard && this.selectedPatientCard.chronicConditions) {
          this.selectedPatientCard.chronicConditions = this.selectedPatientCard.chronicConditions.filter(
            (c: any) => c.conditionId !== conditionId
          );
        }
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error deleting chronic condition:', error);
        this.errorMessage = `Ошибка при удалении хронического заболевания: ${error.message}`;
        this.isLoading = false;
        setTimeout(() => {
          this.errorMessage = '';
        }, 3000);
      }
    });
  }

  // Add a method to translate severity to Russian
  getSeverityTranslation(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'low':
        return 'Низкая';
      case 'medium':
        return 'Средняя';
      case 'high':
        return 'Высокая';
      default:
        return severity;
    }
  }

  // Add a custom validator for date range
  dateRangeValidator(min: Date, max: Date) {
    return (control: any) => {
      if (!control.value) {
        return null;
      }
      
      const date = new Date(control.value);
      
      if (date < min) {
        return { 'dateBeforeMin': { value: control.value } };
      }
      
      if (date > max) {
        return { 'dateAfterMax': { value: control.value } };
      }
      
      return null;
    };
  }

  // Add blood type editing methods
  openBloodTypeModal(): void {
    if (!this.selectedPatientCard) return;
     
    this.bloodTypeForm.patchValue({
      bloodType: this.selectedPatientCard.bloodType || 'O+'
    });
     
    this.showBloodTypeModal = true;
  }
   
  cancelBloodTypeEdit(): void {
    this.showBloodTypeModal = false;
    this.bloodTypeForm.reset();
  }
   
  saveBloodType(): void {
    if (this.bloodTypeForm.invalid || !this.selectedPatientCard) return;
     
    const formValues = this.bloodTypeForm.value;
     
    const updatedPatientCard = {
      ...this.selectedPatientCard,
      bloodType: formValues.bloodType
    };
     
    this.isLoading = true;
    this.patientCardService.updatePatientCard(updatedPatientCard).subscribe({
      next: () => {
        this.selectedPatientCard.bloodType = formValues.bloodType;
        this.successMessage = 'Группа крови успешно обновлена.';
        this.isLoading = false;
        this.showBloodTypeModal = false;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        console.error('Error updating blood type:', error);
        this.errorMessage = 'Ошибка при обновлении группы крови.';
        this.isLoading = false;
        setTimeout(() => this.errorMessage = '', 3000);
      }
    });
  }
  
  backToPatientList(): void {
    // Если есть URL для возврата, переходим по нему
    if (this.returnUrl) {
      console.log('Возврат по URL:', this.returnUrl);
      
      // Проверяем, содержит ли URL путь к редактированию талона
      if (this.returnUrl.includes('/admin/appointments/')) {
        // Используем router.navigate вместо navigateByUrl для сохранения состояния
        const urlParts = this.returnUrl.split('/');
        const appointmentId = urlParts[urlParts.length - 1];
        
        if (this.returnUrl.includes('/edit/')) {
          this.router.navigateByUrl(this.returnUrl);
        } else if (this.returnUrl.includes('/view/')) {
          this.router.navigateByUrl(this.returnUrl);
        } else if (this.returnUrl.includes('/details/')) {
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.router.navigate(['/admin/appointments/details', appointmentId]);
        }
      } else {
        // Если это не путь к редактированию талона, используем navigateByUrl
        this.router.navigateByUrl(this.returnUrl);
      }
      return;
    }
    
    // Иначе возвращаемся к стандартному списку пациентов
    this.showPatientList = true;
    this.showPatientDetails = false;
    this.selectedPatient = null;
    this.selectedPatientCard = null;
  }

  // Open modal to edit patient
  openPatientEditModal(): void {
    if (!this.selectedPatient) return;
    
    this.isPatientFormSubmitted = false;
    
    // Reset and fill the form with patient data
    this.patientEditForm.reset({
      name: this.selectedPatient.name || '',
      gender: this.selectedPatient.gender?.toString() || '0',
      dateOfBirth: this.formatDateForInput(this.selectedPatient.dateOfBirth) || '',
      address: this.selectedPatient.address || ''
    });
    
    this.showPatientEditModal = true;
  }
  
  // Cancel patient edit
  cancelPatientEdit(): void {
    this.showPatientEditModal = false;
    this.isPatientFormSubmitted = false;
  }
  
  // Save patient edit
  savePatientEdit(): void {
    this.isPatientFormSubmitted = true;
    
    if (this.patientEditForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    
    const updatedPatient = {
      patientId: this.selectedPatient.patientId,
      name: this.patientEditForm.get('name')?.value,
      gender: parseInt(this.patientEditForm.get('gender')?.value, 10),
      dateOfBirth: new Date(this.patientEditForm.get('dateOfBirth')?.value),
      address: this.patientEditForm.get('address')?.value
    };
    
    this.patientService.updatePatient(updatedPatient).subscribe({
      next: (response) => {
        console.log('Patient updated:', response);
        
        // Update the selected patient with new data
        this.selectedPatient = response;
        
        // Also update the patient in the patients array
        const index = this.patients.findIndex(p => p.patientId === this.selectedPatient.patientId);
        if (index !== -1) {
          this.patients[index] = response;
          this.filteredPatients = [...this.patients];
        }
        
        this.showPatientEditModal = false;
        this.isPatientFormSubmitted = false;
        this.successMessage = 'Данные пациента успешно обновлены.';
        setTimeout(() => this.successMessage = '', 3000);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error updating patient:', error);
        this.errorMessage = 'Ошибка при обновлении данных пациента.';
        if (error.error && typeof error.error === 'string') {
          this.errorMessage += ` ${error.error}`;
        }
        setTimeout(() => this.errorMessage = '', 5000);
        this.isLoading = false;
      }
    });
  }
  
  // Helper method to format date for input fields
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  }
  
  // Form validation getters
  get patientNameInvalid(): boolean {
    const control = this.patientEditForm.get('name');
    return control?.invalid && (control?.touched || this.isPatientFormSubmitted) ? true : false;
  }
  
  get patientBirthDateInvalid(): boolean {
    const control = this.patientEditForm.get('dateOfBirth');
    return control?.invalid && (control?.touched || this.isPatientFormSubmitted) ? true : false;
  }
  
  get patientAddressInvalid(): boolean {
    const control = this.patientEditForm.get('address');
    return control?.invalid && (control?.touched || this.isPatientFormSubmitted) ? true : false;
  }

  // Новый метод для загрузки пациента по ID
  loadPatientById(patientId: number): void {
    if (!patientId) return;
    
    this.isLoading = true;
    console.log(`Загрузка карточки пациента с ID ${patientId}`);
    
    // Сразу загружаем карточку пациента по ID пациента
    this.patientCardService.getPatientCardByPatientId(patientId).subscribe({
      next: (patientCard) => {
        console.log('Успешно загружена карточка пациента:', patientCard);
        this.selectedPatientCard = patientCard;
        
        // Затем загружаем данные самого пациента
        this.patientService.getPatientById(patientId).subscribe({
          next: (patient) => {
            console.log('Успешно загружен пациент:', patient);
            this.selectedPatient = patient;
            this.showPatientList = false;
            this.showPatientDetails = true;
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Ошибка при загрузке пациента:', error);
            this.errorMessage = `Ошибка при загрузке пациента: ${error.status} ${error.statusText}`;
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('Ошибка при загрузке карточки пациента:', error);
        this.errorMessage = `Ошибка при загрузке карточки пациента: ${error.status} ${error.statusText}`;
        
        // Если карточка не найдена, можно предложить создать новую
        if (error.status === 404) {
          console.log('Карточка не найдена, загружаем данные пациента');
          // Загружаем хотя бы данные пациента
          this.patientService.getPatientById(patientId).subscribe({
            next: (patient) => {
              console.log('Успешно загружен пациент:', patient);
              this.selectedPatient = patient;
              this.showPatientList = false;
              this.showPatientDetails = true;
              this.isLoading = false;
              // Предложить создать карточку
              this.openPatientCardModal();
            },
            error: (err) => {
              console.error('Ошибка при загрузке пациента:', err);
              this.errorMessage = `Ошибка при загрузке пациента: ${err.status} ${err.statusText}`;
              this.isLoading = false;
            }
          });
        } else {
          this.isLoading = false;
        }
      }
    });
  }
} 