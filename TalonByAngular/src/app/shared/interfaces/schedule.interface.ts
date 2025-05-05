export interface TimeSlot {
  id: number;
  doctorId: number;
  date: string; // дата в формате YYYY-MM-DD
  time: string; // время в формате HH:MM
  duration: number; // длительность в минутах
  isAvailable: boolean;
  isTaken: boolean; // слот занят пациентом
}

export interface ScheduleSettings {
  doctorId: number;
  workdayStart: string; // время начала рабочего дня (HH:MM)
  workdayEnd: string; // время окончания рабочего дня (HH:MM)
  slotDuration: number; // длительность слота в минутах
  breakDuration: number; // длительность перерыва между слотами
  workDays: string; // дни недели в формате строки с разделителями запятой (например, '1,2,3,4,5')
  lunchBreak: boolean; // включен ли обеденный перерыв
  lunchStart: string; // время начала обеда (HH:MM)
  lunchEnd: string; // время окончания обеда (HH:MM)
  hospitalId?: number; // ID больницы (для администраторов)
}

export interface DoctorScheduleView {
  doctorId: number;
  doctorName: string;
  specialization: string;
  timeSlots: TimeSlot[];
  schedule?: {[date: string]: TimeSlot[]};
}

export interface Hospital {
  id: number;
  name: string;
}

// Интерфейс для настроек автоматической генерации
export interface AutoGenerationSettings {
  autoGenerationSettingsId?: number;
  isEnabled: boolean;
  scope: string;
  periodType: string;
  nextGenerationDate: string;
  hospitalId?: number;
  specialityId?: number;
  doctorId?: number;
  scheduleSettings: ScheduleSettings;
} 