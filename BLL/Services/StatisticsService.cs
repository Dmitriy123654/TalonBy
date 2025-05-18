using Domain.Interfaces;
using Domain.ViewModels.Statistics;
using System;
using System.Threading.Tasks;

namespace BLL.Services
{
    /// <summary>
    /// Сервис для работы со статистикой
    /// </summary>
    public class StatisticsService : IStatisticsService
    {
        private readonly IStatisticsRepository _statisticsRepository;

        public StatisticsService(IStatisticsRepository statisticsRepository)
        {
            _statisticsRepository = statisticsRepository;
        }

        /// <summary>
        /// Получение статистики по расписанию
        /// </summary>
        /// <param name="request">Параметры запроса статистики</param>
        /// <returns>Данные статистики расписания</returns>
        public async Task<ScheduleStatisticsViewModel> GetScheduleStatisticsAsync(StatisticsRequestViewModel request)
        {
            // Проверяем и вычисляем даты на основе периода, учитывая StartFromToday
            if (!request.FromDate.HasValue || !request.ToDate.HasValue)
            {
                // Получаем даты из периода
                (DateTime fromDate, DateTime toDate) = CalculatePeriodDates(request.Period, request.StartFromToday);
                request.FromDate = fromDate;
                request.ToDate = toDate;
            }

            return await _statisticsRepository.GetScheduleStatisticsAsync(request);
        }

        /// <summary>
        /// Получение статистики по доступности слотов для конкретного врача
        /// </summary>
        /// <param name="doctorId">Идентификатор врача</param>
        /// <param name="fromDate">Начальная дата</param>
        /// <param name="toDate">Конечная дата</param>
        /// <returns>Статистика по доступности слотов</returns>
        public async Task<ScheduleStatisticsViewModel> GetSlotAvailabilityStatisticsAsync(int doctorId, DateTime fromDate, DateTime toDate)
        {
            // Проверка входных данных
            if (doctorId <= 0)
            {
                throw new ArgumentException("Идентификатор врача должен быть положительным числом.");
            }
            
            if (fromDate > toDate)
            {
                throw new ArgumentException("Начальная дата не может быть позже конечной даты.");
            }
            
            return await _statisticsRepository.GetSlotAvailabilityStatisticsAsync(doctorId, fromDate, toDate);
        }

        /// <summary>
        /// Получение статистики по загруженности больницы
        /// </summary>
        /// <param name="hospitalId">Идентификатор больницы</param>
        /// <param name="period">Период статистики</param>
        /// <returns>Статистика по загруженности больницы</returns>
        public async Task<ScheduleStatisticsViewModel> GetHospitalOccupancyStatisticsAsync(int hospitalId, StatisticsPeriodEnum period)
        {
            // Проверка входных данных
            if (hospitalId <= 0)
            {
                throw new ArgumentException("Идентификатор больницы должен быть положительным числом.");
            }
            
            return await _statisticsRepository.GetHospitalOccupancyStatisticsAsync(hospitalId, period);
        }

        /// <summary>
        /// Проверка корректности запроса статистики
        /// </summary>
        /// <param name="request">Запрос статистики</param>
        private void ValidateStatisticsRequest(StatisticsRequestViewModel request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request), "Запрос не может быть null.");
            }

            switch (request.Scope)
            {
                case StatisticsScopeEnum.SelectedDoctor:
                    if (!request.DoctorId.HasValue || request.DoctorId.Value <= 0)
                    {
                        throw new ArgumentException("Для области 'SelectedDoctor' должен быть указан корректный DoctorId.");
                    }
                    break;
                    
                case StatisticsScopeEnum.SelectedSpecialty:
                    if (!request.SpecialtyId.HasValue || request.SpecialtyId.Value <= 0)
                    {
                        throw new ArgumentException("Для области 'SelectedSpecialty' должен быть указан корректный SpecialtyId.");
                    }
                    
                    if (request.HospitalId.HasValue && request.HospitalId.Value <= 0)
                    {
                        throw new ArgumentException("Если указан HospitalId, он должен быть положительным числом.");
                    }
                    break;
                    
                case StatisticsScopeEnum.SelectedHospital:
                    if (!request.HospitalId.HasValue || request.HospitalId.Value <= 0)
                    {
                        throw new ArgumentException("Для области 'SelectedHospital' должен быть указан корректный HospitalId.");
                    }
                    break;
            }

            if (request.FromDate.HasValue && request.ToDate.HasValue && request.FromDate.Value > request.ToDate.Value)
            {
                throw new ArgumentException("Начальная дата не может быть позже конечной даты.");
            }
        }

        /// <summary>
        /// Расчет дат периода на основе типа периода
        /// </summary>
        /// <param name="period">Тип периода</param>
        /// <param name="startFromToday">Начинать с сегодняшнего дня</param>
        /// <returns>Кортеж с начальной и конечной датой</returns>
        private (DateTime fromDate, DateTime toDate) CalculatePeriodDates(StatisticsPeriodEnum period, bool startFromToday)
        {
            DateTime today = DateTime.Today;
            DateTime fromDate, toDate;
            
            switch (period)
            {
                case StatisticsPeriodEnum.Day:
                    fromDate = today;
                    toDate = today;
                    break;
                
                case StatisticsPeriodEnum.Week:
                    if (startFromToday)
                    {
                        fromDate = today;
                        toDate = today.AddDays(6);
                    }
                    else
                    {
                        // Начало текущей недели (понедельник)
                        int daysUntilMonday = ((int)today.DayOfWeek - 1 + 7) % 7;
                        fromDate = today.AddDays(-daysUntilMonday);
                        toDate = fromDate.AddDays(6);
                    }
                    break;
                
                case StatisticsPeriodEnum.Month:
                    if (startFromToday)
                    {
                        fromDate = today;
                        toDate = today.AddMonths(1).AddDays(-1);
                    }
                    else
                    {
                        fromDate = new DateTime(today.Year, today.Month, 1);
                        toDate = fromDate.AddMonths(1).AddDays(-1);
                    }
                    break;
                
                case StatisticsPeriodEnum.ThreeMonths:
                    if (startFromToday)
                    {
                        fromDate = today;
                        toDate = today.AddMonths(3).AddDays(-1);
                    }
                    else
                    {
                        fromDate = new DateTime(today.Year, today.Month, 1).AddMonths(-2);
                        toDate = new DateTime(today.Year, today.Month, 1).AddMonths(1).AddDays(-1);
                    }
                    break;
                
                case StatisticsPeriodEnum.Year:
                    if (startFromToday)
                    {
                        fromDate = today;
                        toDate = today.AddYears(1).AddDays(-1);
                    }
                    else
                    {
                        fromDate = new DateTime(today.Year, 1, 1);
                        toDate = new DateTime(today.Year, 12, 31);
                    }
                    break;
                
                default:
                    fromDate = today;
                    toDate = today;
                    break;
            }
            
            return (fromDate, toDate);
        }

        /// <summary>
        /// Анализ загруженности и формирование рекомендаций по оптимизации расписания
        /// </summary>
        /// <param name="request">Параметры для анализа</param>
        /// <returns>Рекомендации по оптимизации расписания</returns>
        public async Task<ScheduleOptimizationViewModel> AnalyzeScheduleOptimizationAsync(StatisticsRequestViewModel request)
        {
            // Проверяем и вычисляем даты на основе периода, учитывая StartFromToday
            if (!request.FromDate.HasValue || !request.ToDate.HasValue)
            {
                // Получаем даты из периода
                (DateTime fromDate, DateTime toDate) = CalculatePeriodDates(request.Period, request.StartFromToday);
                request.FromDate = fromDate;
                request.ToDate = toDate;
            }

            ValidateStatisticsRequest(request);

            return await _statisticsRepository.AnalyzeScheduleOptimizationAsync(request);
        }

        /// <summary>
        /// Анализ трендов загруженности для более точных рекомендаций
        /// </summary>
        /// <param name="currentRequest">Параметры для анализа текущего периода</param>
        /// <returns>Информация о трендах загруженности</returns>
        public async Task<OptimizationTrendsViewModel> AnalyzeTrendsAsync(StatisticsRequestViewModel currentRequest)
        {
            // Проверяем и вычисляем даты на основе периода для текущего запроса
            if (!currentRequest.FromDate.HasValue || !currentRequest.ToDate.HasValue)
            {
                // Получаем даты из периода
                (DateTime fromDate, DateTime toDate) = CalculatePeriodDates(currentRequest.Period, currentRequest.StartFromToday);
                currentRequest.FromDate = fromDate;
                currentRequest.ToDate = toDate;
            }

            ValidateStatisticsRequest(currentRequest);
            
            // Создаем запрос для исторического периода (трехмесячный период)
            var historicalRequest = new StatisticsRequestViewModel
            {
                Scope = currentRequest.Scope,
                Period = StatisticsPeriodEnum.ThreeMonths,
                HospitalId = currentRequest.HospitalId,
                SpecialtyId = currentRequest.SpecialtyId,
                DoctorId = currentRequest.DoctorId,
                StartFromToday = false // Для исторических данных используем полный период
            };
            
            // Анализируем тренды
            return await _statisticsRepository.AnalyzeTrendsAsync(currentRequest, historicalRequest);
        }
    }
} 