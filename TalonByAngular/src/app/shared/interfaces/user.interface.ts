export interface User {
  userId: number;
  email: string;
  fullName: string;
  address?: string;
  birthDate?: string;
  phone?: string;
  patients?: Patient[];
}

export interface Patient {
  patientId: number;
  fullName: string;
  relationship: string;
  birthDate: string;
  address?: string;
  isAdult: boolean;
}

export enum PatientType {
  Adult = 'adult',
  Child = 'child'
} 