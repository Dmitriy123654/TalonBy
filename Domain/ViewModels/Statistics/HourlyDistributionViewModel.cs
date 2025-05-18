namespace Domain.ViewModels.Statistics
{
    /// <summary>
    /// Модель представления почасового распределения статистики
    /// </summary>
    public class HourlyDistributionViewModel
    {
        /// <summary>
        /// Часовой интервал (например, "09:00-10:00")
        /// </summary>
        public string Hour { get; set; }
        
        /// <summary>
        /// Общее количество записей в этот интервал
        /// </summary>
        public int TotalAppointments { get; set; }
        
        /// <summary>
        /// Количество выполненных записей в этот интервал
        /// </summary>
        public int CompletedAppointments { get; set; }
        
        /// <summary>
        /// Количество ожидающихся записей в этот интервал
        /// </summary>
        public int WaitingAppointments { get; set; }
        
        /// <summary>
        /// Количество отмененных записей в этот интервал
        /// </summary>
        public int CancelledAppointments { get; set; }
        
        /// <summary>
        /// Загруженность в процентах
        /// </summary>
        public double Rate { get; set; }
    }
} 