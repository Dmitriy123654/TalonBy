export interface ScheduleStatistics {
  totalSlots: number;         // Общее количество доступных талонов
  totalAppointments: number;  // Общее количество медицинских записей
  completedAppointments: number; // Количество успешных (выполненных) записей
  waitingAppointments: number;   // Количество ожидаемых записей
  cancelledAppointments: number; // Количество отмененных записей
  occupancyRate: number;      // Загруженность (процент от общего числа талонов)
  hourlyDistribution: HourlyDistribution[]; // Распределение по часам
}

export interface HourlyDistribution {
  hour: string;              // Часовой интервал (например, "09:00-10:00")
  totalAppointments: number; // Общее количество записей в этот интервал
  rate: number;              // Загруженность в процентах
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

export interface StatisticsRequest {
  scope: StatisticsScope;
  period: StatisticsPeriod;
  hospitalId?: number;
  specialtyId?: number;
  doctorId?: number;
  fromDate?: string;
  toDate?: string;
} 