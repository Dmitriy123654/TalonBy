export interface MedicalAppointmentDTO {
  id: number;
  hospitalName: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  receptionStatus: string;
  date: string;
  time: string;
}

export enum AppointmentStatus {
  All = 0,
  Waiting = 4,
  Completed = 1,
  Cancelled = 3
} 