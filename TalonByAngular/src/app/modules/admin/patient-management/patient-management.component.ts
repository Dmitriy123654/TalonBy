import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatientService } from '../../../core/services/patient.service';
import { PatientCardService } from '../../../core/services/patient-card.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-patient-management',
  templateUrl: './patient-management.component.html',
  styleUrls: ['./patient-management.component.scss']
})
export class PatientManagementComponent implements OnInit {
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
  
  constructor(
    private patientService: PatientService,
    private patientCardService: PatientCardService,
    private authService: AuthService,
    private fb: FormBuilder
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
  }

  ngOnInit(): void {
    this.loadPatients();
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
          const gender = (patient.gender || '').toString().toLowerCase();
          return gender.includes(searchText);
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
    this.showPatientList = true;
    this.showPatientDetails = false;
    this.selectedPatient = null;
    this.selectedPatientCard = null;
  }
} 