export interface Hospital {
  id: number;
  name: string;
  address: string;
  type: 'state' | 'private';
}

export interface Department {
  id: number;
  name: string;
  hospitalId: number;
}

export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  departmentId: number;
  photo?: string;
}

export interface TimeSlot {
  id: number;
  doctorId: number;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
}

export interface Appointment {
  id?: number;
  patientId: number;
  doctorId: number;
  timeSlotId: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: Date;
} 