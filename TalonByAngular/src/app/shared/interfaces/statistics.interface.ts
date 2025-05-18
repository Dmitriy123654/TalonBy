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

// Интерфейсы для оптимизации расписания
export interface ScheduleOptimization {
  hasHighOccupancyPeriods: boolean;           // Наличие периодов высокой загруженности (80%+)
  hasLowOccupancyPeriods: boolean;            // Наличие периодов низкой загруженности (менее 20%)
  hourlyOptimizations: HourlyOptimization[];  // Рекомендации по часам с высокой загруженностью
  weekdayOptimizations: WeekdayOptimization[]; // Рекомендации по дням недели с высокой загруженностью
  slotDurationOptimization: SlotDurationOptimization; // Общие рекомендации по оптимизации длительности приема
  estimatedImpactPercentage: number;          // Эффект от применения оптимизаций (в процентах)
  impactDescription: string;                  // Текстовое описание эффекта от оптимизации
  currentSlotDuration: number;                // Текущая средняя длительность приема в минутах
  recommendedSlotDuration: number;            // Рекомендуемая длительность приема в минутах
}

export interface HourlyOptimization {
  hour: string;                     // Часовой интервал
  currentOccupancyRate: number;     // Текущая загруженность (%)
  recommendedSlotDuration: number;  // Рекомендуемая длительность приема в минутах
  expectedOccupancyRate: number;    // Прогнозируемая загруженность после оптимизации (%)
}

export interface WeekdayOptimization {
  dayOfWeek: number;                // День недели (номер 1-7)
  name: string;                     // Название дня недели
  currentOccupancyRate: number;     // Текущая загруженность (%)
  recommendedSlotDuration: number;  // Рекомендуемая длительность приема в минутах
  expectedOccupancyRate: number;    // Прогнозируемая загруженность после оптимизации (%)
}

export interface SlotDurationOptimization {
  optimizationRequired: boolean;    // Требуется ли изменение длительности приема
  currentDuration: number;          // Текущая длительность приема в минутах
  recommendedDuration: number;      // Рекомендуемая длительность приема в минутах
  type: OptimizationType;           // Тип оптимизации
  description: string;              // Описание рекомендации на естественном языке
}

export enum OptimizationType {
  Decrease = 'decrease',            // Уменьшение длительности приема
  Increase = 'increase',            // Увеличение длительности приема
  NoChange = 'noChange'             // Оптимизация не требуется
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

export interface OptimizationTrends {
  occupancyTrend: number;           // Изменение общей загруженности в процентах
  description: string;              // Описание тенденции на естественном языке
  hourlyTrends: HourlyTrend[];      // Тренды по часам
  weekdayTrends: WeekdayTrend[];    // Тренды по дням недели
}

export interface HourlyTrend {
  hour: string;                     // Часовой интервал
  trend: number;                    // Изменение загруженности в процентах
  isGrowing: boolean;               // Флаг роста загруженности
  isDecreasing: boolean;            // Флаг снижения загруженности
  stableHighLoad: boolean;          // Флаг стабильно высокой загруженности
  stableLowLoad: boolean;           // Флаг стабильно низкой загруженности
}

export interface WeekdayTrend {
  dayOfWeek: number;                // День недели (номер 1-7)
  name: string;                     // Название дня недели
  trend: number;                    // Изменение загруженности в процентах
  isGrowing: boolean;               // Флаг роста загруженности
  isDecreasing: boolean;            // Флаг снижения загруженности
  stableHighLoad: boolean;          // Флаг стабильно высокой загруженности
  stableLowLoad: boolean;           // Флаг стабильно низкой загруженности
} 