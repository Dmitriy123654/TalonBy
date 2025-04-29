export interface Doctor {
  doctorId: number;
  fullName: string;
  specialtyId: number;
  specialtyName?: string;
  hospitalId: number;
  hospitalName?: string;
  photo?: string;
  experience?: number;
  rating?: number;
  education?: string;
  description?: string;
} 