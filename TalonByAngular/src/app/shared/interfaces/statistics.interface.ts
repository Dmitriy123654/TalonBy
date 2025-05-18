export interface ScheduleStatistics {
  totalSlots: number;         // Общее количество доступных талонов
  totalAppointments: number;  // Общее количество медицинских записей
  completedAppointments: number; // Количество успешных (выполненных) записей
  waitingAppointments: number;   // Количество ожидаемых записей
  cancelledAppointments: number; // Количество отмененных записей
  occupancyRate: number;      // Загруженность (процент от общего числа талонов)
  hourlyDistribution: HourlyDistribution[]; // Распределение по часам
  weekdayDistribution: WeekdayDistribution[]; // Распределение по дням недели
}

export interface HourlyDistribution {
  hour: string;              // Часовой интервал (например, "09:00-10:00")
  totalAppointments: number; // Общее количество записей в этот интервал
  completedAppointments: number; // Количество выполненных записей
  waitingAppointments: number;   // Количество ожидающихся записей
  cancelledAppointments: number; // Количество отмененных записей
  rate: number;              // Загруженность в процентах
}

export interface WeekdayDistribution {
  dayOfWeek: number;          // Номер дня недели (1-пн, 7-вс)
  name: string;               // Название дня недели 
  totalAppointments: number;  // Общее количество записей в этот день
  completedAppointments: number; // Количество выполненных записей
  waitingAppointments: number;   // Количество ожидающихся записей
  cancelledAppointments: number; // Количество отмененных записей
  rate: number;               // Загруженность в процентах
}

export enum StatisticsPeriod {
  Day = 'day',
  Week = 'week',
  Month = 'month',
  ThreeMonths = 'threeMonths',
  Year = 'year'
}

export enum StatisticsScope {
  AllHospitals = 'allHospitals',
  SelectedHospital = 'selectedHospital',
  SelectedSpecialty = 'selectedSpecialty',
  SelectedDoctor = 'selectedDoctor'
}

export enum AppointmentStatusFilter {
  All = 'all',
  Completed = 'completed',
  Waiting = 'waiting',
  Cancelled = 'cancelled'
}

export interface StatisticsRequest {
  scope: StatisticsScope;
  period: StatisticsPeriod;
  hospitalId?: number;
  specialtyId?: number;
  doctorId?: number;
  fromDate?: string;
  toDate?: string;
  startFromToday?: boolean; // Флаг для начала периода с сегодняшнего дня
} 