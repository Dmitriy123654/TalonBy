import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DoctorService } from '../../../core/services/doctor.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-doctor-management',
  templateUrl: './doctor-management.component.html',
  styleUrls: ['./doctor-management.component.scss']
})
export class DoctorManagementComponent implements OnInit {
  doctors: any[] = [];
  filteredDoctors: any[] = [];
  selectedDoctor: any = null;
  
  // Filters
  searchQuery: string = '';
  selectedHospitalId: number | null = null;
  selectedSpecialityId: number | null = null;
  
  doctorForm: FormGroup;
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  
  // Состояние отображения
  showDoctorList = true;
  showDoctorDetails = false;
  showDoctorModal = false;
  
  // Для выбора специальности и больницы
  specialities: any[] = [];
  filteredSpecialities: any[] = []; // Filtered based on hospital selection
  hospitals: any[] = [];
  
  // User role
  userRole: string = 'Administrator'; // Default to Administrator
  
  // User search
  users: any[] = [];
  filteredUsers: any[] = [];
  userSearchQuery: string = '';
  showUserList: boolean = false;
  
  // Test mode flag for when backend is failing
  isUsingMockData = false;
  
  constructor(
    private doctorService: DoctorService,
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder
  ) {
    this.doctorForm = this.fb.group({
      doctorId: [null],
      fullName: ['', [Validators.required, Validators.maxLength(100)]],
      doctorsSpecialityId: ['', Validators.required],
      hospitalId: ['', Validators.required],
      workingHours: ['', [Validators.required, Validators.maxLength(200)]],
      office: ['', [Validators.required, Validators.maxLength(50)]],
      additionalInfo: ['', Validators.maxLength(500)],
      photo: [''],
      userId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    // Get user info for role-based filtering
    const userInfo = this.authService.getUserInfo();
    this.userRole = userInfo?.role || 'Administrator';
    
    // For ChiefDoctor, we should probably get their hospital ID
    if (this.userRole === 'ChiefDoctor') {
      // Get chief doctor information to set their hospital
      this.doctorService.getCurrentDoctorInfo().subscribe({
        next: (data) => {
          if (data && data.hospitalId) {
            this.selectedHospitalId = data.hospitalId;
          }
        }
      });
    }
    
    // Load initial data
    this.loadDoctors();
    this.loadSpecialities();
    this.loadHospitals();
    
    // Preload user data
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        console.log(`Preloaded ${users.length} users for selection`);
      }
    });
    
    // Setup user search with debounce
    this.setupUserSearch();
  }
  
  // Setup user search with debounce to prevent excessive API calls
  setupUserSearch(): void {
    this.doctorForm.get('userId')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((value: string | number) => {
          if (!value) return of([]);
          return this.userService.searchUsersByKey(value, 'userId');
        })
      )
      .subscribe({
        next: (users: any[]) => {
          if (users && users.length > 0) {
            // User found by ID, populate name if doctor name is empty
            const user = users[0];
            const currentName = this.doctorForm.get('fullName')?.value;
            if (!currentName && user.fullName) {
              this.doctorForm.patchValue({
                fullName: user.fullName
              });
            }
          }
        }
      });
  }
  
  // Check if string is in email format
  isEmailFormat(str: string): boolean {
    return /\S+@\S+\.\S+/.test(str);
  }
  
  // Check if string is in phone format
  isPhoneFormat(str: string): boolean {
    return /^\+?[0-9]{10,15}$/.test(str.replace(/\D/g, ''));
  }
  
  // Toggle user list visibility
  toggleUserList(): void {
    this.showUserList = !this.showUserList;
    
    // If we're showing the list and we don't have users loaded, load them
    if (this.showUserList && this.users.length === 0) {
      this.userService.getAllUsers().subscribe({
        next: (users) => {
          this.users = users;
          console.log(`Loaded ${users.length} users for selection`);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          // If in mock mode, create mock users
          if (this.isUsingMockData) {
            this.createMockUsers();
          }
        }
      });
    }
    
    // Reset search when opening
    if (this.showUserList) {
      this.userSearchQuery = '';
      this.filteredUsers = [];
    }
  }
  
  // Handle user search input
  onUserSearchInput(): void {
    if (!this.userSearchQuery.trim()) {
      this.filteredUsers = [];
      return;
    }
    
    console.log('Searching for users with query:', this.userSearchQuery);
    
    const searchTerm = this.userSearchQuery.toLowerCase().trim();
    
    // Filter based on search term (email, name, phone, or ID)
    this.filteredUsers = this.users.filter(user => {
      const match = (
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.fullName && user.fullName.toLowerCase().includes(searchTerm)) ||
        (user.phone && user.phone.toLowerCase().includes(searchTerm)) ||
        (user.userId && user.userId.toString().includes(searchTerm))
      );
      
      return match;
    });
    
    // Log results for debugging
    console.log(`Found ${this.filteredUsers.length} users matching "${searchTerm}"`);
  }
  
  // Select user for doctor
  selectUser(user: any): void {
    this.doctorForm.patchValue({
      userId: user.userId,
      fullName: user.fullName || this.doctorForm.get('fullName')?.value || ''
    });
    
    // Store the selected user data for reference
    if (!this.selectedDoctor) {
      this.selectedDoctor = {};
    }
    this.selectedDoctor.user = user;
    
    // Hide user list after selection
    this.showUserList = false;
    this.filteredUsers = [];
    this.userSearchQuery = '';
  }
  
  // Load all doctors
  loadDoctors(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Check if we can access the endpoint
    this.doctorService.getAllDoctors().subscribe({
      next: (data) => {
        console.log('Doctors data:', data);
        this.doctors = data;
        
        // Get all userIds from doctors to fetch their details
        const doctorUserIds = this.doctors
          .filter(doctor => doctor.userId)
          .map(doctor => doctor.userId);
        
        console.log('Doctor userIds:', doctorUserIds);
        
        if (doctorUserIds.length > 0) {
          // Get all users to associate with doctors
          this.userService.getAllUsers().subscribe({
            next: (users) => {
              console.log('All users:', users);
              
              // Create a map for quick lookup
              const userMap = new Map(users.map(user => [user.userId, user]));
              
              // Associate users with doctors
              this.doctors.forEach(doctor => {
                if (doctor.userId) {
                  const userData = userMap.get(doctor.userId);
                  if (userData) {
                    doctor.user = userData;
                    console.log(`Associated doctor ${doctor.doctorId} with user ${userData.userId}, email: ${userData.email}`);
                  } else {
                    console.log(`No user found for userId: ${doctor.userId}`);
                    doctor.user = { userId: doctor.userId };
                  }
                }
              });
              
              this.applyFilters();
            },
            error: (error) => {
              console.error('Error fetching users for doctors:', error);
            }
          });
        }
        
        this.applyFilters();
        this.isLoading = false;
        this.isUsingMockData = false;
      },
      error: (error) => {
        console.error('Error loading doctors:', error);
        this.errorMessage = `Ошибка при загрузке врачей: ${error.status} ${error.statusText}`;
        if (error.error && error.error.message) {
          this.errorMessage += ` - ${error.error.message}`;
        }
        
        // Load mock data since the API failed
        this.loadMockDoctors();
        this.isLoading = false;
      }
    });
  }
  
  // Preload user data for all doctors
  preloadUserData(): void {
    // Get unique user IDs from doctors
    const userIds = [...new Set(this.doctors
      .filter(doc => doc.userId && (!doc.user || !doc.user.email))
      .map(doc => doc.userId))];
    
    if (userIds.length === 0) {
      return;
    }
    
    // Get all users
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        // Create a map of users by ID for quick lookup
        const userMap = new Map(users.map(user => [user.userId, user]));
        
        // Update doctor objects with user data
        this.doctors.forEach(doctor => {
          if (doctor.userId && (!doctor.user || !doctor.user.email)) {
            const userData = userMap.get(doctor.userId);
            if (userData) {
              doctor.user = userData;
            } else {
              doctor.user = { 
                userId: doctor.userId,
                email: null
              };
            }
          }
        });
        
        // Also initialize our users array
        this.users = users;
        
        // Re-apply filters to update UI
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        
        // Create placeholder user objects if real data can't be loaded
        this.doctors.forEach(doctor => {
          if (doctor.userId && (!doctor.user || !doctor.user.email)) {
            doctor.user = { 
              userId: doctor.userId,
              email: null
            };
          }
        });
      }
    });
  }
  
  // Load mock doctors data (used when API fails)
  loadMockDoctors(): void {
    console.log('Loading mock doctors data as fallback');
    this.isUsingMockData = true;
    // Add a warning message to the error to indicate we're using mock data
    this.errorMessage += ' - Используются тестовые данные.';
    
    // Create mock data based on loaded specialities and hospitals
    setTimeout(() => {
      // Only create mock data once we have specialities and hospitals
      if (this.specialities.length > 0 && this.hospitals.length > 0) {
        this.createMockDoctors();
      } else {
        // If specialities or hospitals aren't loaded yet, wait a bit more
        setTimeout(() => this.createMockDoctors(), 1000);
      }
    }, 500);
  }
  
  // Create mock doctors data
  createMockDoctors(): void {
    const mockDoctors = [];
    
    // Use actual specialities and hospitals if available
    const specialityIds = this.specialities.length > 0 
      ? this.specialities.map(s => s.doctorsSpecialityId) 
      : [1, 2, 3];
      
    const hospitalIds = this.hospitals.length > 0 
      ? this.hospitals.map(h => h.hospitalId) 
      : [1, 2];
    
    // Create mock users if needed
    if (this.users.length === 0) {
      this.createMockUsers();
    }
    
    // Create 10 mock doctors
    for (let i = 1; i <= 10; i++) {
      const specialityId = specialityIds[Math.floor(Math.random() * specialityIds.length)];
      const hospitalId = hospitalIds[Math.floor(Math.random() * hospitalIds.length)];
      const userId = i; // Associate with mock user
      
      const speciality = this.specialities.find(s => s.doctorsSpecialityId === specialityId);
      const hospital = this.hospitals.find(h => h.hospitalId === hospitalId);
      const user = this.users.find(u => u.userId === userId || u.id === userId);
      
      mockDoctors.push({
        doctorId: i,
        fullName: user ? user.fullName : `Врач Тестовый ${i}`,
        doctorsSpecialityId: specialityId,
        hospitalId: hospitalId,
        userId: userId,
        workingHours: 'Пн-Пт: 9:00-17:00',
        office: `${100 + i}`,
        additionalInfo: 'Тестовые данные для демонстрации интерфейса',
        photo: '',
        doctorsSpeciality: speciality ? { 
          doctorsSpecialityId: speciality.doctorsSpecialityId,
          name: speciality.name 
        } : { doctorsSpecialityId: specialityId, name: 'Тестовая специальность' },
        hospital: hospital ? {
          hospitalId: hospital.hospitalId,
          name: hospital.name
        } : { hospitalId: hospitalId, name: 'Тестовая больница' },
        user: user || { 
          userId: userId, 
          fullName: `Пользователь ${i}`, 
          email: `user${i}@example.com`,
          phone: `+7999${this.padNumber(i, 7)}`
        }
      });
    }
    
    this.doctors = mockDoctors;
    this.applyFilters();
  }
  
  // Load specialities
  loadSpecialities(): void {
    this.doctorService.getAllSpecialities().subscribe({
      next: (data) => {
        console.log('Specialities data:', data);
        this.specialities = data;
        this.filteredSpecialities = data; // Initially all specialities are available
      },
      error: (error) => {
        console.error('Error loading specialities:', error);
        this.errorMessage = `Ошибка при загрузке специальностей: ${error.status} ${error.statusText}`;
        if (error.error && error.error.message) {
          this.errorMessage += ` - ${error.error.message}`;
        }
        // Use empty array for specialities
        this.specialities = [];
        this.filteredSpecialities = [];
      }
    });
  }
  
  // Load hospitals
  loadHospitals(): void {
    this.doctorService.getAllHospitals().subscribe({
      next: (data) => {
        console.log('Hospitals data:', data);
        this.hospitals = data;
      },
      error: (error) => {
        console.error('Error loading hospitals:', error);
        this.errorMessage = `Ошибка при загрузке больниц: ${error.status} ${error.statusText}`;
        if (error.error && error.error.message) {
          this.errorMessage += ` - ${error.error.message}`;
        }
        // Use empty array for hospitals
        this.hospitals = [];
      }
    });
  }
  
  // Handlers for filter changes
  onHospitalChange(): void {
    // Reset speciality selection when hospital changes
    this.selectedSpecialityId = null;
    
    // Filter specialities based on the selected hospital
    if (this.selectedHospitalId) {
      // In a real app, you'd fetch specialities for this hospital from the API
      // For now, we'll keep using all specialities
      this.filteredSpecialities = this.specialities;
    } else {
      // If no hospital selected, show all specialities
      this.filteredSpecialities = this.specialities;
    }
    
    // Apply the filters
    this.applyFilters();
  }
  
  onSpecialityChange(): void {
    this.applyFilters();
  }
  
  // Reset all filters
  resetFilters(): void {
    this.searchQuery = '';
    this.selectedSpecialityId = null;
    
    // Only reset hospital for admin
    if (this.userRole === 'Administrator') {
      this.selectedHospitalId = null;
    }
    
    this.filteredSpecialities = this.specialities;
    this.applyFilters();
  }
  
  // Apply all filters and search to doctors list
  applyFilters(): void {
    let filtered = [...this.doctors];
    
    // Apply hospital filter if selected
    if (this.selectedHospitalId) {
      filtered = filtered.filter(doctor => doctor.hospitalId == this.selectedHospitalId);
    }
    
    // Apply speciality filter if selected
    if (this.selectedSpecialityId) {
      filtered = filtered.filter(doctor => doctor.doctorsSpecialityId == this.selectedSpecialityId);
    }
    
    // Apply search query filter (by name)
    if (this.searchQuery && this.searchQuery.trim() !== '') {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doctor => 
        doctor.fullName.toLowerCase().includes(query)
      );
    }
    
    this.filteredDoctors = filtered;
  }
  
  // View doctor details
  viewDoctorDetails(doctor: any): void {
    this.selectedDoctor = doctor;
    this.showDoctorList = false;
    this.showDoctorDetails = true;
  }
  
  // Back to doctor list
  backToDoctorList(): void {
    this.showDoctorList = true;
    this.showDoctorDetails = false;
    this.selectedDoctor = null;
  }
  
  // Open modal to add/edit doctor
  openDoctorModal(doctor?: any): void {
    this.resetMessages();
    
    // Preload user data first to ensure we have it ready for selection
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        console.log(`Loaded ${users.length} users for doctor association`);
        this.users = users;
        
        if (doctor) {
          // Edit mode
          console.log('Editing doctor with data:', doctor);
          console.log('Doctor ID:', doctor.doctorId);
          console.log('Doctor userId:', doctor.userId);
          
          this.doctorForm.patchValue({
            doctorId: doctor.doctorId,
            fullName: doctor.fullName,
            doctorsSpecialityId: doctor.doctorsSpecialityId,
            hospitalId: doctor.hospitalId,
            workingHours: doctor.workingHours,
            office: doctor.office,
            additionalInfo: doctor.additionalInfo,
            photo: doctor.photo,
            userId: doctor.userId
          });
          this.selectedDoctor = {...doctor};
          
          // If doctor has userId but not user data, find matching user
          if (doctor.userId && (!doctor.user || !doctor.user.email)) {
            const user = this.users.find(u => u.userId == doctor.userId);
            if (user) {
              console.log(`Found user with email ${user.email} for doctor ${doctor.fullName}`);
              doctor.user = user;
            } else {
              console.log(`No user found for doctor userId: ${doctor.userId}`);
            }
          }
        } else {
          // Add mode
          this.doctorForm.reset();
          
          // If user is ChiefDoctor, pre-select their hospital
          if (this.userRole === 'ChiefDoctor' && this.selectedHospitalId) {
            this.doctorForm.patchValue({
              hospitalId: this.selectedHospitalId
            });
          }
          
          this.selectedDoctor = null;
        }
        
        this.showDoctorModal = true;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        
        // Continue even without users
        if (doctor) {
          // Edit mode
          this.doctorForm.patchValue({
            doctorId: doctor.doctorId,
            fullName: doctor.fullName,
            doctorsSpecialityId: doctor.doctorsSpecialityId,
            hospitalId: doctor.hospitalId,
            workingHours: doctor.workingHours,
            office: doctor.office,
            additionalInfo: doctor.additionalInfo,
            photo: doctor.photo,
            userId: doctor.userId
          });
          this.selectedDoctor = {...doctor};
        } else {
          // Add mode
          this.doctorForm.reset();
          
          // If user is ChiefDoctor, pre-select their hospital
          if (this.userRole === 'ChiefDoctor' && this.selectedHospitalId) {
            this.doctorForm.patchValue({
              hospitalId: this.selectedHospitalId
            });
          }
          
          this.selectedDoctor = null;
        }
        
        this.showDoctorModal = true;
      }
    });
    
    // Reset user search
    this.filteredUsers = [];
    this.userSearchQuery = '';
  }
  
  // Save doctor (create or update)
  saveDoctor(): void {
    // Отметить все поля как touched для активации валидации
    this.markFormGroupTouched(this.doctorForm);
    
    if (this.doctorForm.invalid) {
      return;
    }
    
    const doctorData = this.doctorForm.value;
    
    // Установка дефолтных значений для необязательных полей, если они пустые
    if (!doctorData.additionalInfo) {
      doctorData.additionalInfo = '';
    }
    
    // Определяем, редактируем существующего или добавляем нового врача
    const isEditMode = !!this.selectedDoctor?.doctorId;
    const doctorId = isEditMode ? this.selectedDoctor.doctorId : null;
    
    this.isLoading = true;
    
    console.log('Saving doctor with data:', doctorData);
    console.log('Doctor ID for update:', doctorId);
    console.log('Is edit mode:', isEditMode);
    
    // If using mock data, just simulate API call
    if (this.isUsingMockData) {
      setTimeout(() => {
        if (isEditMode) {
          // Update in mock data
          const index = this.doctors.findIndex(d => d.doctorId === doctorId);
          if (index !== -1) {
            // Get associated user
            const user = this.users.find(u => u.userId == doctorData.userId);
            
            // Update existing doctor in array
            const updatedDoctor = { 
              ...this.doctors[index], 
              ...doctorData,
              // Make sure nested objects are updated
              doctorsSpeciality: this.specialities.find(s => s.doctorsSpecialityId == doctorData.doctorsSpecialityId),
              hospital: this.hospitals.find(h => h.hospitalId == doctorData.hospitalId),
              user: user
            };
            this.doctors[index] = updatedDoctor;
            this.successMessage = 'Врач успешно обновлен (тестовый режим)';
          }
        } else {
          // Get associated user
          const user = this.users.find(u => u.userId == doctorData.userId);
          
          // Add to mock data
          const newDoctor = {
            doctorId: this.doctors.length + 1,
            ...doctorData,
            // Add nested objects
            doctorsSpeciality: this.specialities.find(s => s.doctorsSpecialityId == doctorData.doctorsSpecialityId),
            hospital: this.hospitals.find(h => h.hospitalId == doctorData.hospitalId),
            user: user
          };
          this.doctors.push(newDoctor);
          this.successMessage = 'Врач успешно добавлен (тестовый режим)';
        }
        
        this.applyFilters();
        this.isLoading = false;
        this.showDoctorModal = false;
      }, 500);
      return;
    }
    
    if (isEditMode) {
      // Update existing doctor
      console.log('Updating doctor with ID:', doctorId, typeof doctorId);
      this.doctorService.updateDoctor(doctorId, doctorData).subscribe({
        next: () => {
          this.successMessage = 'Врач успешно обновлен';
          this.isLoading = false;
          this.showDoctorModal = false;
          this.loadDoctorsAndUpdateUI();
        },
        error: (error) => {
          console.error('Error updating doctor:', error);
          this.errorMessage = `Ошибка при обновлении врача: ${error.status} ${error.statusText}`;
          if (error.error && error.error.message) {
            this.errorMessage += ` - ${error.error.message}`;
          }
          this.isLoading = false;
        }
      });
    } else {
      // Create new doctor
      this.doctorService.createDoctor(doctorData).subscribe({
        next: () => {
          this.successMessage = 'Врач успешно добавлен';
          this.isLoading = false;
          this.showDoctorModal = false;
          this.loadDoctorsAndUpdateUI();
        },
        error: (error) => {
          console.error('Error adding doctor:', error);
          this.errorMessage = `Ошибка при добавлении врача: ${error.status} ${error.statusText}`;
          if (error.error && error.error.message) {
            this.errorMessage += ` - ${error.error.message}`;
          }
          this.isLoading = false;
        }
      });
    }
  }
  
  // Метод для загрузки врачей и обновления UI
  loadDoctorsAndUpdateUI(): void {
    this.doctorService.getAllDoctors().subscribe({
      next: (data) => {
        console.log('Doctors data after save:', data);
        this.doctors = data;
        
        // Обновляем пользовательские данные для врачей
        this.preloadUserData(); 
        
        // Применяем фильтры и обновляем UI
        this.applyFilters();
        
        // Если открыт режим просмотра врача, обновляем данные выбранного врача
        if (this.showDoctorDetails && this.selectedDoctor) {
          const updatedDoctor = data.find(d => d.doctorId === this.selectedDoctor.doctorId);
          if (updatedDoctor) {
            console.log('Updating selected doctor details:', updatedDoctor);
            // Загружаем актуальные данные по врачу, включая связи
            this.doctorService.getDoctorById(updatedDoctor.doctorId).subscribe({
              next: (detailedDoctor) => {
                console.log('Loaded detailed doctor data:', detailedDoctor);
                
                // Обновляем данные о пользователе, если они есть
                if (detailedDoctor.userId) {
                  const user = this.users.find(u => u.userId == detailedDoctor.userId);
                  if (user) {
                    detailedDoctor.user = user;
                  }
                }
                
                this.selectedDoctor = detailedDoctor;
              },
              error: (error) => {
                console.error('Error loading detailed doctor data:', error);
                
                // Используем данные из общего списка, если детальная загрузка не удалась
                this.selectedDoctor = {...updatedDoctor};
                
                // Обновляем данные о пользователе, если они есть
                if (updatedDoctor.userId) {
                  const user = this.users.find(u => u.userId == updatedDoctor.userId);
                  if (user) {
                    this.selectedDoctor.user = user;
                  }
                }
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Error reloading doctors:', error);
      }
    });
  }
  
  // Delete doctor
  deleteDoctor(doctorId: number): void {
    if (confirm('Вы уверены, что хотите удалить врача?')) {
      this.isLoading = true;
      
      // If using mock data, just simulate API call
      if (this.isUsingMockData) {
        setTimeout(() => {
          this.doctors = this.doctors.filter(d => d.doctorId !== doctorId);
          this.applyFilters();
          this.successMessage = 'Врач успешно удален (тестовый режим)';
          this.isLoading = false;
          
          if (this.showDoctorDetails) {
            this.backToDoctorList();
          }
        }, 500);
        return;
      }
      
      this.doctorService.deleteDoctor(doctorId).subscribe({
        next: () => {
          this.successMessage = 'Врач успешно удален';
          this.isLoading = false;
          
          if (this.showDoctorDetails) {
            this.backToDoctorList();
          }
          
          this.loadDoctorsAndUpdateUI();
        },
        error: (error) => {
          console.error('Error deleting doctor:', error);
          this.errorMessage = `Ошибка при удалении врача: ${error.status} ${error.statusText}`;
          if (error.error && error.error.message) {
            this.errorMessage += ` - ${error.error.message}`;
          }
          this.isLoading = false;
        }
      });
    }
  }
  
  // Close doctor modal
  closeDoctorModal(): void {
    this.showDoctorModal = false;
  }
  
  // Reset messages
  resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
  
  // Helper method to mark all controls in a form group as touched
  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if ((control as any).controls) {
        this.markFormGroupTouched(control as FormGroup);
      }
    });
  }
  
  // Create mock users (for test mode)
  createMockUsers(): void {
    const mockUsers = [];
    
    for (let i = 1; i <= 20; i++) {
      mockUsers.push({
        userId: i,
        fullName: `Пользователь ${i}`,
        email: `user${i}@example.com`,
        phone: `+7999${this.padNumber(i, 7)}`
      });
    }
    
    this.users = mockUsers;
    this.filteredUsers = mockUsers;
  }
  
  // Helper to pad number with zeros for phone
  padNumber(num: number, length: number): string {
    return num.toString().padStart(length, '0');
  }
} 