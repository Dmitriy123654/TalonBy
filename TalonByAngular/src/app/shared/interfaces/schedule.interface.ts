export interface TimeSlot {
  id: number;
  doctorId: number;
  date: string; // дата в формате YYYY-MM-DD
  time: string; // время в формате HH:MM
  duration: number; // длительность в минутах
  isAvailable: boolean;
}

export interface ScheduleSettings {
  doctorId: number;
  workdayStart: string; // время начала рабочего дня (HH:MM)
  workdayEnd: string; // время окончания рабочего дня (HH:MM)
  slotDuration: number; // длительность слота в минутах
  breakDuration: number; // длительность перерыва между слотами
  workDays: number[]; // дни недели (0-6, где 0 - воскресенье)
}

export interface DoctorScheduleView {
  doctorId: number;
  doctorName: string;
  specialization?: string;
  schedule: {
    [date: string]: TimeSlot[]
  };
} 