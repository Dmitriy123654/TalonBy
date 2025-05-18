using System.Collections.Generic;

namespace Domain.ViewModels.Statistics
{
    /// <summary>
    /// Модель представления статистики расписания
    /// </summary>
    public class ScheduleStatisticsViewModel
    {
        /// <summary>
        /// Общее количество доступных талонов
        /// </summary>
        public int TotalSlots { get; set; }
        
        /// <summary>
        /// Общее количество медицинских записей
        /// </summary>
        public int TotalAppointments { get; set; }
        
        /// <summary>
        /// Количество успешных (выполненных) записей
        /// </summary>
        public int CompletedAppointments { get; set; }
        
        /// <summary>
        /// Количество ожидаемых записей
        /// </summary>
        public int WaitingAppointments { get; set; }
        
        /// <summary>
        /// Количество отмененных записей
        /// </summary>
        public int CancelledAppointments { get; set; }
        
        /// <summary>
        /// Загруженность (процент от общего числа талонов)
        /// </summary>
        public double OccupancyRate { get; set; }
        
        /// <summary>
        /// Распределение по часам
        /// </summary>
        public List<HourlyDistributionViewModel> HourlyDistribution { get; set; } = new List<HourlyDistributionViewModel>();
        
        /// <summary>
        /// Распределение по дням недели
        /// </summary>
        public List<WeekdayDistributionViewModel> WeekdayDistribution { get; set; } = new List<WeekdayDistributionViewModel>();
    }
} 