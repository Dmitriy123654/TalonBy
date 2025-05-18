export interface AppointmentMedicalDetails {
  appointmentMedicalDetailsId: number;
  medicalAppointmentId: number;
  diagnosis: string;
  treatment: string;
  prescriptions: string;
  labResults?: string;
  medicalHistory?: string;
  allergies?: string;
  vitalSigns?: string;
  nextAppointmentDate?: string;
}

export interface AppointmentMedicalDetailsCreateModel {
  medicalAppointmentId: number;
  diagnosis: string;
  treatment: string;
  prescriptions: string;
  labResults?: string;
  medicalHistory?: string;
  allergies?: string;
  vitalSigns?: string;
  nextAppointmentDate?: string;
}

export interface AppointmentMedicalDetailsUpdateModel {
  diagnosis: string;
  treatment: string;
  prescriptions: string;
  labResults?: string;
  medicalHistory?: string;
  allergies?: string;
  vitalSigns?: string;
  nextAppointmentDate?: string;
} 