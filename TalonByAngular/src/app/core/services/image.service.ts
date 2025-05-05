import { Injectable } from '@angular/core';

/**
 * Service for managing image assets in the application
 */
@Injectable({
  providedIn: 'root'
})
export class ImageService {
  // Base path for images
  private readonly basePath = 'assets/images';
  
  // Path for doctor images
  private readonly doctorImagesPath = `${this.basePath}/doctors`;
  
  // Default placeholder image for doctors without photos
  private readonly defaultDoctorImage = `${this.doctorImagesPath}/default-doctor.png`;
  
  // Map of doctor specialities to default specialty images (if needed)
  private readonly specialtyDefaultImages: Record<string, string> = {
    // Add specialty specific defaults if needed
    'Терапевт': `${this.doctorImagesPath}/default-therapist.png`,
    'Кардиолог': `${this.doctorImagesPath}/default-cardiologist.png`,
    'Невролог': `${this.doctorImagesPath}/default-neurologist.png`,
    'Хирург': `${this.doctorImagesPath}/default-surgeon.png`,
    'Педиатр': `${this.doctorImagesPath}/default-pediatrician.png`,
    'Стоматолог': `${this.doctorImagesPath}/default-dentist.png`,
    'Офтальмолог': `${this.doctorImagesPath}/default-ophthalmologist.png`,
    'Гинеколог': `${this.doctorImagesPath}/default-gynecologist.png`,
  };

  constructor() { }

  /**
   * Get doctor image URL by doctor ID
   * @param doctorId Doctor ID
   * @param specialtyName Optional specialty name for fallback image
   * @returns Image URL
   */
  getDoctorImage(doctorId: number, specialtyName?: string): string {
    // First try the doctor's specific image
    const doctorImage = `${this.doctorImagesPath}/doctor-${doctorId}.jpg`;
    
    // If specialty is provided, try to get specialty default
    const specialtyImage = specialtyName ? this.specialtyDefaultImages[specialtyName] : undefined;
    
    // Either return the doctor's specific image, specialty default, or general default
    return doctorImage || specialtyImage || this.defaultDoctorImage;
  }

  /**
   * Get path for storing new doctor image
   * @param doctorId Doctor ID
   * @returns Path for storing doctor image
   */
  getDoctorImagePath(doctorId: number): string {
    return `${this.doctorImagesPath}/doctor-${doctorId}.jpg`;
  }
} 