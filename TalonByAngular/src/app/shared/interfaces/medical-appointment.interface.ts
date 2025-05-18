export interface MedicalAppointmentDTO {
  id: number;
  hospitalName: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  receptionStatus: string;
  date: string;
  time: string;
  patientCardId?: number;
  patientId?: number;
}

export enum AppointmentStatus {
  All = 0,
  Completed = 2,
  Waiting = 4,
  Cancelled = 5
} 