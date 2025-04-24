export interface User {
  userId: number;
  email: string;
  fullName: string;
  address?: string;
  birthDate?: string;
  phone?: string;
  patients?: Patient[];
  role?: string; // User role from RoleOfUser enum
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

// Match the roles from Domain/Enums.cs
export enum RoleOfUser {
  Patient = 'Patient',
  Doctor = 'Doctor',
  ChiefDoctor = 'ChiefDoctor',
  Administrator = 'Administrator',
  SystemAnalyst = 'SystemAnalyst',
  MedicalStaff = 'MedicalStaff'
} 