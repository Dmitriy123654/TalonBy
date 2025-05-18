using Domain.ViewModels.Statistics;
using System;
using System.Threading.Tasks;

namespace BLL.Services
{
    /// <summary>
    /// Интерфейс сервиса статистики
    /// </summary>
    public interface IStatisticsService
    {
        /// <summary>
        /// Получение статистики по расписанию
        /// </summary>
        /// <param name="request">Параметры запроса статистики</param>
        /// <returns>Данные статистики расписания</returns>
        Task<ScheduleStatisticsViewModel> GetScheduleStatisticsAsync(StatisticsRequestViewModel request);
        
        /// <summary>
        /// Получение статистики по доступности слотов для конкретного врача
        /// </summary>
        /// <param name="doctorId">Идентификатор врача</param>
        /// <param name="fromDate">Начальная дата</param>
        /// <param name="toDate">Конечная дата</param>
        /// <returns>Статистика по доступности слотов</returns>
        Task<ScheduleStatisticsViewModel> GetSlotAvailabilityStatisticsAsync(int doctorId, DateTime fromDate, DateTime toDate);
        
        /// <summary>
        /// Получение статистики по загруженности больницы
        /// </summary>
        /// <param name="hospitalId">Идентификатор больницы</param>
        /// <param name="period">Период статистики</param>
        /// <returns>Статистика по загруженности больницы</returns>
        Task<ScheduleStatisticsViewModel> GetHospitalOccupancyStatisticsAsync(int hospitalId, StatisticsPeriodEnum period);
        
        /// <summary>
        /// Анализ загруженности и формирование рекомендаций по оптимизации расписания
        /// </summary>
        /// <param name="request">Параметры для анализа</param>
        /// <returns>Рекомендации по оптимизации расписания</returns>
        Task<ScheduleOptimizationViewModel> AnalyzeScheduleOptimizationAsync(StatisticsRequestViewModel request);
        
        /// <summary>
        /// Анализ трендов загруженности для более точных рекомендаций
        /// </summary>
        /// <param name="currentRequest">Параметры для анализа текущего периода</param>
        /// <returns>Информация о трендах загруженности</returns>
        Task<OptimizationTrendsViewModel> AnalyzeTrendsAsync(StatisticsRequestViewModel currentRequest);
    }
} 