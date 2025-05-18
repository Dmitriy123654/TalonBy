namespace Domain.ViewModels.Statistics
{
    /// <summary>
    /// Модель распределения записей по дням недели
    /// </summary>
    public class WeekdayDistributionViewModel
    {
        /// <summary>
        /// Номер дня недели (1-7, где 1 - понедельник, 7 - воскресенье)
        /// </summary>
        public int DayOfWeek { get; set; }
        
        /// <summary>
        /// Название дня недели
        /// </summary>
        public string Name { get; set; }
        
        /// <summary>
        /// Общее количество записей в этот день недели
        /// </summary>
        public int TotalAppointments { get; set; }
        
        /// <summary>
        /// Количество выполненных записей
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
        /// Загруженность в процентах для данного дня недели
        /// </summary>
        public double Rate { get; set; }
    }
} 