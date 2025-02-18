export enum HospitalType {
  Adult = 0,
  Children = 1,
  Specialized = 2
}

export interface Hospital {
  $id?: string;
  hospitalId: number;
  name: string;
  address: string;
  type: HospitalType;
  workingHours: string;
  phones: string;
  email: string;
  description: string;
  doctors?: any[];
  medicalAppointments?: any[];
}

export interface Department {
  id: number;
  name: string;
}

export interface DoctorSpeciality {
  id: number;
  name: string;
  description?: string;
}

export interface Doctor {
  id: number;
  name: string;
  specialityId: number;
  schedule?: {
    start: string;
    end: string;
  };
}

export interface TimeSlot {
  id: number;
  startTime: string;
  isAvailable: boolean;
}

export interface Appointment {
  id: number;
  createdAt: string;
  patientId: number;
  hospitalId: number;
  departmentId: number;
  doctorId: number;
  timeSlotId: number;
  status: string;
}

export interface Speciality {
  id: number;
  name: string;
  link: string;
} 