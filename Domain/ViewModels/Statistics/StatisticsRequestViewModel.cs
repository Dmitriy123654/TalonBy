using System;

namespace Domain.ViewModels.Statistics
{
    /// <summary>
    /// Модель запроса статистики
    /// </summary>
    public class StatisticsRequestViewModel
    {
        /// <summary>
        /// Область применения статистики
        /// </summary>
        public StatisticsScopeEnum Scope { get; set; }
        
        /// <summary>
        /// Период статистики
        /// </summary>
        public StatisticsPeriodEnum Period { get; set; }
        
        /// <summary>
        /// Идентификатор больницы (если применимо)
        /// </summary>
        public int? HospitalId { get; set; }
        
        /// <summary>
        /// Идентификатор специальности (если применимо)
        /// </summary>
        public int? SpecialtyId { get; set; }
        
        /// <summary>
        /// Идентификатор врача (если применимо)
        /// </summary>
        public int? DoctorId { get; set; }
        
        /// <summary>
        /// Начальная дата для периода (если применимо)
        /// </summary>
        public DateTime? FromDate { get; set; }
        
        /// <summary>
        /// Конечная дата для периода (если применимо)
        /// </summary>
        public DateTime? ToDate { get; set; }
        
        /// <summary>
        /// Флаг начала периода с сегодняшнего дня
        /// </summary>
        public bool StartFromToday { get; set; }
    }
    
    /// <summary>
    /// Перечисление областей статистики
    /// </summary>
    public enum StatisticsScopeEnum
    {
        /// <summary>
        /// Для всех больниц
        /// </summary>
        AllHospitals,
        
        /// <summary>
        /// Для выбранной больницы
        /// </summary>
        SelectedHospital,
        
        /// <summary>
        /// Для выбранной специальности
        /// </summary>
        SelectedSpecialty,
        
        /// <summary>
        /// Для выбранного врача
        /// </summary>
        SelectedDoctor
    }
    
    /// <summary>
    /// Перечисление периодов статистики
    /// </summary>
    public enum StatisticsPeriodEnum
    {
        /// <summary>
        /// День
        /// </summary>
        Day,
        
        /// <summary>
        /// Неделя
        /// </summary>
        Week,
        
        /// <summary>
        /// Месяц
        /// </summary>
        Month,
        
        /// <summary>
        /// Три месяца
        /// </summary>
        ThreeMonths,
        
        /// <summary>
        /// Год
        /// </summary>
        Year
    }
} 