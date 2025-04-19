import { Component, OnInit } from '@angular/core';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { User, Patient, PatientType } from '../../shared/interfaces/user.interface';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  activeTab: string = 'patients';
  showEditForm: boolean = false;
  
  constructor(
    private userService: UserService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.userService.getUserProfile().subscribe({
      next: (user) => {
        this.currentUser = user;
      },
      error: (error) => {
        console.error('Error loading user profile:', error);
      }
    });
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  editProfile(): void {
    this.showEditForm = true;
  }

  deleteProfile(): void {
    if (confirm('Вы уверены, что хотите удалить профиль?')) {
      // Call API to delete profile
      console.log('Profile deleted');
    }
  }

  editPatient(patientId: number): void {
    console.log(`Editing patient with ID: ${patientId}`);
    // Navigate to edit patient form or show modal
  }

  deletePatient(patientId: number): void {
    if (confirm('Вы уверены, что хотите удалить этого пациента?')) {
      this.userService.deletePatient(patientId).subscribe({
        next: (success) => {
          if (success) {
            console.log(`Patient with ID ${patientId} deleted successfully`);
            // Refresh the user profile
            this.loadUserProfile();
          } else {
            console.error(`Failed to delete patient with ID ${patientId}`);
          }
        },
        error: (error) => {
          console.error('Error deleting patient:', error);
        }
      });
    }
  }

  addAdultPatient(): void {
    console.log('Add adult patient');
    // Navigate to add adult patient form or show modal
  }

  addChildPatient(): void {
    console.log('Add child patient');
    // Navigate to add child patient form or show modal
  }
} 