using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels.Statistics;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    /// <summary>
    /// Репозиторий для работы со статистикой
    /// </summary>
    public class StatisticsRepository : IStatisticsRepository
    {
        private readonly ApplicationContext _context;
        
        public StatisticsRepository(ApplicationContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Получение статистики по расписанию
        /// </summary>
        /// <param name="request">Параметры запроса статистики</param>
        /// <returns>Данные статистики расписания</returns>
        public async Task<ScheduleStatisticsViewModel> GetScheduleStatisticsAsync(StatisticsRequestViewModel request)
        {
            // Определяем даты периода
            (DateTime fromDate, DateTime toDate) = CalculatePeriodDates(request.Period);
            
            // Если указаны пользовательские даты, используем их
            if (request.FromDate.HasValue)
            {
                fromDate = request.FromDate.Value;
            }
            
            if (request.ToDate.HasValue)
            {
                toDate = request.ToDate.Value;
            }
            
            // Базовый запрос для выборки временных слотов
            var slotsQuery = _context.TimeSlots.AsQueryable();
            
            // Фильтруем по периоду
            slotsQuery = slotsQuery.Where(s => s.Date >= fromDate && s.Date <= toDate);
            
            // Запрос для выборки приемов
            var appointmentsQuery = _context.MedicalAppointments.AsQueryable()
                .Where(a => a.Date >= fromDate && a.Date <= toDate);
            
            // Применяем фильтры в зависимости от области
            switch (request.Scope)
            {
                case StatisticsScopeEnum.SelectedDoctor:
                    if (!request.DoctorId.HasValue)
                    {
                        throw new ArgumentException("DoctorId is required for SelectedDoctor scope");
                    }
                    slotsQuery = slotsQuery.Where(s => s.DoctorId == request.DoctorId.Value);
                    appointmentsQuery = appointmentsQuery.Where(a => a.DoctorId == request.DoctorId.Value);
                    break;
                    
                case StatisticsScopeEnum.SelectedSpecialty:
                    if (!request.SpecialtyId.HasValue)
                    {
                        throw new ArgumentException("SpecialtyId is required for SelectedSpecialty scope");
                    }
                    
                    // Находим врачей с нужной специализацией
                    var specialtyDoctorIds = _context.Doctors
                        .Where(d => d.DoctorsSpecialityId == request.SpecialtyId.Value)
                        .Select(d => d.DoctorId)
                        .ToList();
                    
                    slotsQuery = slotsQuery.Where(s => specialtyDoctorIds.Contains(s.DoctorId));
                    appointmentsQuery = appointmentsQuery.Where(a => specialtyDoctorIds.Contains(a.DoctorId));
                    
                    if (request.HospitalId.HasValue)
                    {
                        slotsQuery = slotsQuery.Where(s => s.Doctor.HospitalId == request.HospitalId.Value);
                        appointmentsQuery = appointmentsQuery.Where(a => a.HospitalId == request.HospitalId.Value);
                    }
                    break;
                    
                case StatisticsScopeEnum.SelectedHospital:
                    if (!request.HospitalId.HasValue)
                    {
                        throw new ArgumentException("HospitalId is required for SelectedHospital scope");
                    }
                    slotsQuery = slotsQuery.Where(s => s.Doctor.HospitalId == request.HospitalId.Value);
                    appointmentsQuery = appointmentsQuery.Where(a => a.HospitalId == request.HospitalId.Value);
                    break;
                    
                case StatisticsScopeEnum.AllHospitals:
                    // Не применяем дополнительных фильтров
                    break;
            }
            
            // Получаем все временные слоты
            var timeSlots = await slotsQuery
                .Include(s => s.Doctor)
                .ToListAsync();
            
            // Получаем все приемы для данного периода и фильтров
            var appointments = await appointmentsQuery.ToListAsync();
            
            // Получаем статистику на основе данных
            var result = CalculateStatistics(timeSlots, appointments);
            
            return result;
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
            var timeSlots = await _context.TimeSlots
                .Where(s => s.DoctorId == doctorId && s.Date >= fromDate && s.Date <= toDate)
                .Include(s => s.Doctor)
                .ToListAsync();
                
            var appointments = await _context.MedicalAppointments
                .Where(a => a.DoctorId == doctorId && a.Date >= fromDate && a.Date <= toDate)
                .ToListAsync();
                
            return CalculateStatistics(timeSlots, appointments);
        }

        /// <summary>
        /// Получение статистики по загруженности больницы
        /// </summary>
        /// <param name="hospitalId">Идентификатор больницы</param>
        /// <param name="period">Период статистики</param>
        /// <returns>Статистика по загруженности больницы</returns>
        public async Task<ScheduleStatisticsViewModel> GetHospitalOccupancyStatisticsAsync(int hospitalId, StatisticsPeriodEnum period)
        {
            // Определяем даты периода
            (DateTime fromDate, DateTime toDate) = CalculatePeriodDates(period);
            
            var timeSlots = await _context.TimeSlots
                .Where(s => s.Doctor.HospitalId == hospitalId && s.Date >= fromDate && s.Date <= toDate)
                .Include(s => s.Doctor)
                .ToListAsync();
                
            var appointments = await _context.MedicalAppointments
                .Where(a => a.HospitalId == hospitalId && a.Date >= fromDate && a.Date <= toDate)
                .ToListAsync();
                
            return CalculateStatistics(timeSlots, appointments);
        }

        /// <summary>
        /// Расчет статистики на основе временных слотов и записей на прием
        /// </summary>
        /// <param name="timeSlots">Временные слоты</param>
        /// <param name="appointments">Записи на прием</param>
        /// <returns>Рассчитанная статистика</returns>
        private ScheduleStatisticsViewModel CalculateStatistics(List<TimeSlot> timeSlots, List<MedicalAppointment> appointments)
        {
            var result = new ScheduleStatisticsViewModel
            {
                TotalSlots = timeSlots.Count,
                TotalAppointments = appointments.Count,
                CompletedAppointments = appointments.Count(a => a.ReceptionStatusId == 2), // Completed
                WaitingAppointments = appointments.Count(a => a.ReceptionStatusId == 4), // Waiting
                CancelledAppointments = appointments.Count(a => a.ReceptionStatusId == 5) // Cancelled
            };
            
            // Рассчитываем занятость (загруженность для выполненных относительно всех доступных слотов)
            if (timeSlots.Count > 0)
            {
                result.OccupancyRate = Math.Round((double)result.CompletedAppointments / timeSlots.Count * 100, 2);
            }
            
            // Расчет почасового распределения
            result.HourlyDistribution = CalculateHourlyDistribution(appointments, timeSlots);
            
            // Расчет распределения по дням недели
            result.WeekdayDistribution = CalculateWeekdayDistribution(appointments, timeSlots);
            
            return result;
        }

        /// <summary>
        /// Расчет распределения записей по дням недели
        /// </summary>
        /// <param name="appointments">Записи на прием</param>
        /// <param name="timeSlots">Доступные временные слоты</param>
        /// <returns>Распределение записей по дням недели</returns>
        private List<WeekdayDistributionViewModel> CalculateWeekdayDistribution(List<MedicalAppointment> appointments, List<TimeSlot> timeSlots)
        {
            var weekdayDistribution = new Dictionary<int, (int total, int completedAppointments, int waitingAppointments, int cancelledAppointments)>();
            
            // Инициализация словаря для всех дней недели (1-7, где 1 - понедельник, 7 - воскресенье)
            for (int dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek++)
            {
                weekdayDistribution[dayOfWeek] = (0, 0, 0, 0);
            }
            
            // Группируем приемы по дням недели
            foreach (var appointment in appointments)
            {
                // Получаем день недели (1-7, где 1 - понедельник)
                int dayOfWeek = (int)appointment.Date.DayOfWeek;
                // В .NET Sunday = 0, так что преобразуем к ISO где Monday = 1, Sunday = 7
                dayOfWeek = dayOfWeek == 0 ? 7 : dayOfWeek;
                
                var (total, completed, waiting, cancelled) = weekdayDistribution[dayOfWeek];
                
                switch (appointment.ReceptionStatusId)
                {
                    case 2: // Completed
                        weekdayDistribution[dayOfWeek] = (total + 1, completed + 1, waiting, cancelled);
                        break;
                    case 4: // Waiting
                        weekdayDistribution[dayOfWeek] = (total + 1, completed, waiting + 1, cancelled);
                        break;
                    case 5: // Cancelled
                        weekdayDistribution[dayOfWeek] = (total + 1, completed, waiting, cancelled + 1);
                        break;
                    default:
                        // Для других статусов просто подсчитываем общее количество
                        weekdayDistribution[dayOfWeek] = (total + 1, completed, waiting, cancelled);
                        break;
                }
            }
            
            // Названия дней недели на русском
            var dayNames = new Dictionary<int, string>
            {
                { 1, "ПН" },
                { 2, "ВТ" },
                { 3, "СР" },
                { 4, "ЧТ" },
                { 5, "ПТ" },
                { 6, "СБ" },
                { 7, "ВС" }
            };
            
            // Преобразуем в список WeekdayDistributionViewModel
            var result = new List<WeekdayDistributionViewModel>();
            
            foreach (var day in weekdayDistribution.OrderBy(d => d.Key))
            {
                var (total, completed, waiting, cancelled) = day.Value;
                
                // Расчет слотов для текущего дня недели
                int slotsForThisDay = timeSlots.Count(s => {
                    // Получаем день недели для слота (1-7)
                    int slotDayOfWeek = (int)s.Date.DayOfWeek;
                    slotDayOfWeek = slotDayOfWeek == 0 ? 7 : slotDayOfWeek;
                    return slotDayOfWeek == day.Key;
                });
                
                // Расчет загруженности для каждого дня недели
                // Загруженность = (выполненные / общее количество слотов в этот день) * 100%
                double rate = slotsForThisDay > 0 ? (completed * 100.0) / slotsForThisDay : 0;
                
                result.Add(new WeekdayDistributionViewModel
                {
                    DayOfWeek = day.Key,
                    Name = dayNames[day.Key],
                    TotalAppointments = total,
                    CompletedAppointments = completed,
                    WaitingAppointments = waiting,
                    CancelledAppointments = cancelled,
                    Rate = rate
                });
            }
            
            return result;
        }

        /// <summary>
        /// Расчет почасового распределения записей
        /// </summary>
        /// <param name="appointments">Записи на прием</param>
        /// <param name="timeSlots">Доступные временные слоты</param>
        /// <returns>Рассчитанное почасовое распределение</returns>
        private List<HourlyDistributionViewModel> CalculateHourlyDistribution(List<MedicalAppointment> appointments, List<TimeSlot> timeSlots)
        {
            var hourlyDistribution = new Dictionary<string, (int total, int completedAppointments, int waitingAppointments, int cancelledAppointments)>();

            // Часовые интервалы с 0:00 до 23:00
            for (int hour = 0; hour < 24; hour++)
            {
                string interval = $"{hour:D2}:00-{(hour + 1) % 24:D2}:00";
                hourlyDistribution[interval] = (0, 0, 0, 0);
            }

            // Группируем приемы по часам и статусам
            foreach (var appointment in appointments)
            {
                if (appointment.Time != null)
                {
                    int hour = appointment.Time.Hours;
                    string interval = $"{hour:D2}:00-{(hour + 1) % 24:D2}:00";
                    if (hourlyDistribution.ContainsKey(interval))
                    {
                        var (total, completed, waiting, cancelled) = hourlyDistribution[interval];
                        
                        // Увеличиваем общее количество записей
                        total++;
                        
                        // Группируем по статусам
                        if (appointment.ReceptionStatusId == 2) // Выполненные
                        {
                            completed++;
                        }
                        else if (appointment.ReceptionStatusId == 4) // Ожидающиеся
                        {
                            waiting++;
                        }
                        else if (appointment.ReceptionStatusId == 5) // Отмененные
                        {
                            cancelled++;
                        }
                        
                        hourlyDistribution[interval] = (total, completed, waiting, cancelled);
                    }
                }
            }

            // Определяем интервал часов для статистики (по умолчанию 8:00-18:00)
            int statisticsStartHour = 8;
            int statisticsEndHour = 18;
            
            // Формируем результат с заполнением часовых интервалов
            var result = new List<HourlyDistributionViewModel>();
            
            foreach (var hour in hourlyDistribution.OrderBy(h => h.Key.Substring(0, 2)))
            {
                int hourNumber = int.Parse(hour.Key.Split(':')[0]);
                if (hourNumber >= statisticsStartHour && hourNumber < statisticsEndHour)
                {
                    var (total, completed, waiting, cancelled) = hour.Value;
                    
                    // Расчет загруженности для каждого часа
                    // Загруженность = (выполненные / общее количество слотов в этот час) * 100%
                    // Для расчета количества слотов для каждого часа нам нужно добавить логику подсчета слотов
                    int slotsInThisHour = timeSlots.Count(s => s.Time != null && s.Time.Hours == hourNumber);
                    double rate = slotsInThisHour > 0 ? (completed * 100.0) / slotsInThisHour : 0;
                    
                    result.Add(new HourlyDistributionViewModel
                    {
                        Hour = hour.Key,
                        TotalAppointments = total,
                        CompletedAppointments = completed,
                        WaitingAppointments = waiting,
                        CancelledAppointments = cancelled,
                        Rate = rate
                    });
                }
            }

            return result;
        }

        /// <summary>
        /// Расчет дат начала и окончания для заданного периода
        /// </summary>
        /// <param name="period">Период статистики</param>
        /// <returns>Кортеж (начальная дата, конечная дата)</returns>
        private (DateTime fromDate, DateTime toDate) CalculatePeriodDates(StatisticsPeriodEnum period)
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
                    int daysUntilMonday = ((int)today.DayOfWeek - 1 + 7) % 7;
                    fromDate = today.AddDays(-daysUntilMonday); // Начало текущей недели (понедельник)
                    toDate = fromDate.AddDays(6); // Конец недели (воскресенье)
                    break;
                
                case StatisticsPeriodEnum.Month:
                    fromDate = new DateTime(today.Year, today.Month, 1);
                    toDate = fromDate.AddMonths(1).AddDays(-1);
                    break;
                
                case StatisticsPeriodEnum.ThreeMonths:
                    fromDate = new DateTime(today.Year, today.Month, 1).AddMonths(-2);
                    toDate = new DateTime(today.Year, today.Month, 1).AddMonths(1).AddDays(-1);
                    break;
                
                case StatisticsPeriodEnum.Year:
                    fromDate = new DateTime(today.Year, 1, 1);
                    toDate = new DateTime(today.Year, 12, 31);
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
            // Получаем статистику для анализа
            var statistics = await GetScheduleStatisticsAsync(request);
            
            // Пороговые значения для определения высокой и низкой загруженности
            const double highOccupancyThreshold = 80.0; // 80% и выше считается высокой загруженностью
            const double lowOccupancyThreshold = 20.0;  // 20% и ниже считается низкой загруженностью
            
            var result = new ScheduleOptimizationViewModel
            {
                HasHighOccupancyPeriods = false,
                HasLowOccupancyPeriods = false,
                HourlyOptimizations = new List<HourlyOptimizationViewModel>(),
                WeekdayOptimizations = new List<WeekdayOptimizationViewModel>(),
                SlotDurationOptimization = new SlotDurationOptimizationViewModel()
            };
            
            // Получаем текущую длительность приема из настроек
            int currentSlotDuration = await GetCurrentSlotDurationAsync(request);
            result.CurrentSlotDuration = currentSlotDuration;
            
            // Анализ почасовой загруженности
            foreach (var hourData in statistics.HourlyDistribution)
            {
                if (hourData.Rate >= highOccupancyThreshold)
                {
                    result.HasHighOccupancyPeriods = true;
                    
                    // Рекомендуемая длительность приема - в два раза меньше для высокой загруженности
                    int recommendedDuration = Math.Max(currentSlotDuration / 2, 5); // Минимум 5 минут
                    
                    // Расчет ожидаемой загруженности после оптимизации
                    double expectedRate = hourData.Rate * recommendedDuration / currentSlotDuration;
                    
                    result.HourlyOptimizations.Add(new HourlyOptimizationViewModel
                    {
                        Hour = hourData.Hour,
                        CurrentOccupancyRate = hourData.Rate,
                        RecommendedSlotDuration = recommendedDuration,
                        ExpectedOccupancyRate = Math.Round(expectedRate, 2)
                    });
                }
                else if (hourData.Rate <= lowOccupancyThreshold)
                {
                    result.HasLowOccupancyPeriods = true;
                    
                    // Рекомендуемая длительность приема - в два раза больше для низкой загруженности
                    int recommendedDuration = Math.Min(currentSlotDuration * 2, 60); // Максимум 60 минут
                    
                    // Расчет ожидаемой загруженности после оптимизации
                    double expectedRate = hourData.Rate * recommendedDuration / currentSlotDuration;
                    
                    result.HourlyOptimizations.Add(new HourlyOptimizationViewModel
                    {
                        Hour = hourData.Hour,
                        CurrentOccupancyRate = hourData.Rate,
                        RecommendedSlotDuration = recommendedDuration,
                        ExpectedOccupancyRate = Math.Round(expectedRate, 2)
                    });
                }
            }
            
            // Анализ загруженности по дням недели
            foreach (var dayData in statistics.WeekdayDistribution)
            {
                if (dayData.Rate >= highOccupancyThreshold)
                {
                    result.HasHighOccupancyPeriods = true;
                    
                    // Рекомендуемая длительность приема - в два раза меньше для высокой загруженности
                    int recommendedDuration = Math.Max(currentSlotDuration / 2, 5); // Минимум 5 минут
                    
                    // Расчет ожидаемой загруженности после оптимизации
                    double expectedRate = dayData.Rate * recommendedDuration / currentSlotDuration;
                    
                    result.WeekdayOptimizations.Add(new WeekdayOptimizationViewModel
                    {
                        DayOfWeek = dayData.DayOfWeek,
                        Name = dayData.Name,
                        CurrentOccupancyRate = dayData.Rate,
                        RecommendedSlotDuration = recommendedDuration,
                        ExpectedOccupancyRate = Math.Round(expectedRate, 2)
                    });
                }
                else if (dayData.Rate <= lowOccupancyThreshold)
                {
                    result.HasLowOccupancyPeriods = true;
                    
                    // Рекомендуемая длительность приема - в два раза больше для низкой загруженности
                    int recommendedDuration = Math.Min(currentSlotDuration * 2, 60); // Максимум 60 минут
                    
                    // Расчет ожидаемой загруженности после оптимизации
                    double expectedRate = dayData.Rate * recommendedDuration / currentSlotDuration;
                    
                    result.WeekdayOptimizations.Add(new WeekdayOptimizationViewModel
                    {
                        DayOfWeek = dayData.DayOfWeek,
                        Name = dayData.Name,
                        CurrentOccupancyRate = dayData.Rate,
                        RecommendedSlotDuration = recommendedDuration,
                        ExpectedOccupancyRate = Math.Round(expectedRate, 2)
                    });
                }
            }
            
            // Общая рекомендация по оптимизации длительности приема
            result.SlotDurationOptimization = DetermineOverallOptimization(
                statistics, 
                currentSlotDuration, 
                result.HasHighOccupancyPeriods, 
                result.HasLowOccupancyPeriods);
                
            result.RecommendedSlotDuration = result.SlotDurationOptimization.RecommendedDuration;
            
            // Расчет общего эффекта от оптимизации
            CalculateOptimizationImpact(result, statistics);
            
            return result;
        }
        
        /// <summary>
        /// Получение текущей длительности приема из настроек
        /// </summary>
        /// <param name="request">Параметры запроса</param>
        /// <returns>Текущая длительность приема в минутах</returns>
        private async Task<int> GetCurrentSlotDurationAsync(StatisticsRequestViewModel request)
        {
            // По умолчанию, если не можем определить
            int defaultDuration = 30; 
            
            try
            {
                // Получаем настройки врача или больницы в зависимости от области анализа
                if (request.DoctorId.HasValue)
                {
                    var settings = await _context.DoctorScheduleSettings
                        .Where(s => s.DoctorId == request.DoctorId.Value)
                        .FirstOrDefaultAsync();
                        
                    if (settings != null)
                    {
                        return settings.SlotDuration;
                    }
                }
                else if (request.HospitalId.HasValue)
                {
                    // Для больницы берем среднюю длительность приема всех врачей
                    var doctorIds = await _context.Doctors
                        .Where(d => d.HospitalId == request.HospitalId.Value)
                        .Select(d => d.DoctorId)
                        .ToListAsync();
                        
                    if (doctorIds.Any())
                    {
                        var settings = await _context.DoctorScheduleSettings
                            .Where(s => doctorIds.Contains(s.DoctorId))
                            .ToListAsync();
                            
                        if (settings.Any())
                        {
                            return (int)settings.Average(s => s.SlotDuration);
                        }
                    }
                }
                
                // Если не смогли определить конкретную длительность, используем среднюю по всем врачам
                var avgDuration = await _context.DoctorScheduleSettings
                    .AverageAsync(s => s.SlotDuration);
                    
                return (int)avgDuration;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при получении длительности приема: {ex.Message}");
                return defaultDuration;
            }
        }
        
        /// <summary>
        /// Определяет общую рекомендацию по оптимизации расписания
        /// </summary>
        private SlotDurationOptimizationViewModel DetermineOverallOptimization(
            ScheduleStatisticsViewModel statistics, 
            int currentDuration, 
            bool hasHighOccupancyPeriods, 
            bool hasLowOccupancyPeriods)
        {
            var result = new SlotDurationOptimizationViewModel
            {
                CurrentDuration = currentDuration,
                RecommendedDuration = currentDuration,
                OptimizationRequired = false,
                Type = OptimizationTypeEnum.NoChange,
                Description = "Оптимизация расписания не требуется"
            };
            
            // Если общая загруженность высокая (более 80%), рекомендуем уменьшить длительность приема
            if (statistics.OccupancyRate >= 80.0)
            {
                // Вычисляем рекомендуемую длительность (снижение на 20-50% в зависимости от загруженности)
                double factor = 1.0 - Math.Min(0.5, ((statistics.OccupancyRate - 80.0) / 40.0) + 0.2);
                int recommendedDuration = Math.Max((int)(currentDuration * factor), 5); // Минимум 5 минут
                
                // Проверка на изменение длительности (рекомендованная должна отличаться от текущей)
                if (recommendedDuration != currentDuration)
                {
                    result.RecommendedDuration = recommendedDuration;
                    result.OptimizationRequired = true;
                    result.Type = OptimizationTypeEnum.Decrease;
                    result.Description = $"Рекомендуется уменьшить длительность приема с {currentDuration} до {recommendedDuration} минут из-за высокой загруженности ({Math.Round(statistics.OccupancyRate, 2)}%)";
                }
                return result;
            }
            
            // Если общая загруженность низкая (менее 20%), рекомендуем увеличить длительность приема
            if (statistics.OccupancyRate <= 20.0)
            {
                // Вычисляем рекомендуемую длительность (увеличение на 20-100% в зависимости от загруженности)
                double factor = 1.0 + Math.Min(1.0, ((20.0 - statistics.OccupancyRate) / 20.0) + 0.2);
                int recommendedDuration = Math.Min((int)(currentDuration * factor), 60); // Максимум 60 минут
                
                // Проверка на изменение длительности (рекомендованная должна отличаться от текущей)
                if (recommendedDuration != currentDuration)
                {
                    result.RecommendedDuration = recommendedDuration;
                    result.OptimizationRequired = true;
                    result.Type = OptimizationTypeEnum.Increase;
                    result.Description = $"Рекомендуется увеличить длительность приема с {currentDuration} до {recommendedDuration} минут из-за низкой загруженности ({Math.Round(statistics.OccupancyRate, 2)}%)";
                }
                return result;
            }
            
            // Если есть часы или дни с высокой загруженностью, но общая загруженность в норме
            if (hasHighOccupancyPeriods)
            {
                result.Description = "Обнаружены периоды с высокой загруженностью. Рекомендуется уменьшить длительность приема для конкретных периодов";
            }
            
            // Если есть часы или дни с низкой загруженностью, но общая загруженность в норме
            if (hasLowOccupancyPeriods)
            {
                if (hasHighOccupancyPeriods)
                {
                    result.Description += " и увеличить для периодов с низкой загруженностью";
                }
                else
                {
                    result.Description = "Обнаружены периоды с низкой загруженностью. Рекомендуется увеличить длительность приема для этих периодов";
                }
            }
            
            return result;
        }
        
        /// <summary>
        /// Расчет влияния предлагаемых оптимизаций на загруженность
        /// </summary>
        /// <param name="optimization">Данные оптимизации</param>
        /// <param name="statistics">Текущая статистика</param>
        private void CalculateOptimizationImpact(ScheduleOptimizationViewModel optimization, ScheduleStatisticsViewModel statistics)
        {
            if (!optimization.SlotDurationOptimization.OptimizationRequired)
            {
                optimization.EstimatedImpactPercentage = 0;
                optimization.ImpactDescription = "Существенного изменения загруженности не ожидается";
                return;
            }
            
            // Для упрощения расчетов предполагаем, что после изменения длительности приема
            // загруженность изменится пропорционально отношению длительностей
            double currentRate = statistics.OccupancyRate;
            int currentDuration = optimization.CurrentSlotDuration;
            int recommendedDuration = optimization.RecommendedSlotDuration;
            
            // Расчет новой загруженности
            double newRate = currentRate * currentDuration / recommendedDuration;
            
            // Изменение в процентных пунктах
            double change = newRate - currentRate;
            
            // Изменение в процентах от текущего значения (относительное изменение)
            double relativeChange = currentRate > 0 ? (change / currentRate * 100) : 0;
            
            optimization.EstimatedImpactPercentage = Math.Round(relativeChange, 2);
            
            // Формирование описания влияния
            string direction = change > 0 ? "увеличится" : "уменьшится";
            string impact = Math.Abs(change) > 10 ? "значительно" : "незначительно";
            
            optimization.ImpactDescription = $"Ожидается, что загруженность {impact} {direction} " +
                $"с {Math.Round(currentRate, 2)}% до {Math.Round(newRate, 2)}% " +
                $"({Math.Abs(Math.Round(change, 2))} процентных пунктов, {Math.Abs(Math.Round(relativeChange, 2))}%)";
        }

        /// <summary>
        /// Анализ трендов загруженности для более точных рекомендаций
        /// </summary>
        /// <param name="request">Параметры для анализа текущего периода</param>
        /// <param name="historicalRequest">Параметры для анализа исторического периода</param>
        /// <returns>Информация о трендах загруженности</returns>
        public async Task<OptimizationTrendsViewModel> AnalyzeTrendsAsync(StatisticsRequestViewModel request, StatisticsRequestViewModel historicalRequest)
        {
            // Получаем статистику для текущего и исторического периодов
            var currentStatistics = await GetScheduleStatisticsAsync(request);
            var historicalStatistics = await GetScheduleStatisticsAsync(historicalRequest);
            
            // Создаем объект для анализа трендов
            var trends = new OptimizationTrendsViewModel();
            
            // Определяем общую тенденцию по изменению загруженности
            trends.OccupancyTrend = Math.Round(currentStatistics.OccupancyRate - historicalStatistics.OccupancyRate, 2);
            
            // Формируем описание тенденции
            if (trends.OccupancyTrend > 5)
            {
                trends.Description = $"Наблюдается тенденция к росту загруженности: +{trends.OccupancyTrend}%. ";
                
                // Если загруженность растет, рекомендуем уменьшить длительность приема
                trends.Description += "Рекомендуется рассмотреть возможность уменьшения длительности приема.";
            }
            else if (trends.OccupancyTrend < -5)
            {
                trends.Description = $"Наблюдается тенденция к снижению загруженности: {trends.OccupancyTrend}%. ";
                
                // Если загруженность падает, рекомендуем увеличить длительность приема
                trends.Description += "Рекомендуется рассмотреть возможность увеличения длительности приема.";
            }
            else
            {
                trends.Description = $"Загруженность остается стабильной (изменение: {trends.OccupancyTrend}%). Текущие рекомендации по оптимизации актуальны.";
            }
            
            // Анализируем тренды по часам
            foreach (var currentHour in currentStatistics.HourlyDistribution)
            {
                // Ищем соответствующий час в исторических данных
                var historicalHour = historicalStatistics.HourlyDistribution
                    .FirstOrDefault(h => h.Hour == currentHour.Hour);
                
                if (historicalHour != null)
                {
                    // Рассчитываем изменение загруженности по сравнению с прошлым периодом
                    double rateDiff = Math.Round(currentHour.Rate - historicalHour.Rate, 2);
                    
                    // Создаем объект тренда по часам
                    var hourlyTrend = new HourlyTrendViewModel
                    {
                        Hour = currentHour.Hour,
                        Trend = rateDiff,
                        IsGrowing = rateDiff > 5, // Рост более чем на 5% считается значительным
                        IsDecreasing = rateDiff < -5, // Снижение более чем на 5% считается значительным
                        StableHighLoad = currentHour.Rate >= 75 && historicalHour.Rate >= 75, // Стабильно высокая загрузка
                        StableLowLoad = currentHour.Rate <= 25 && historicalHour.Rate <= 25 // Стабильно низкая загрузка
                    };
                    
                    trends.HourlyTrends.Add(hourlyTrend);
                }
            }
            
            // Анализируем тренды по дням недели
            foreach (var currentDay in currentStatistics.WeekdayDistribution)
            {
                // Ищем соответствующий день недели в исторических данных
                var historicalDay = historicalStatistics.WeekdayDistribution
                    .FirstOrDefault(d => d.DayOfWeek == currentDay.DayOfWeek);
                
                if (historicalDay != null)
                {
                    // Рассчитываем изменение загруженности по сравнению с прошлым периодом
                    double rateDiff = Math.Round(currentDay.Rate - historicalDay.Rate, 2);
                    
                    // Создаем объект тренда по дням недели
                    var weekdayTrend = new WeekdayTrendViewModel
                    {
                        DayOfWeek = currentDay.DayOfWeek,
                        Name = currentDay.Name,
                        Trend = rateDiff,
                        IsGrowing = rateDiff > 5,
                        IsDecreasing = rateDiff < -5,
                        StableHighLoad = currentDay.Rate >= 75 && historicalDay.Rate >= 75,
                        StableLowLoad = currentDay.Rate <= 25 && historicalDay.Rate <= 25
                    };
                    
                    trends.WeekdayTrends.Add(weekdayTrend);
                }
            }
            
            // Сортируем тренды по убыванию изменения
            trends.HourlyTrends = trends.HourlyTrends
                .OrderByDescending(t => Math.Abs(t.Trend))
                .ToList();
                
            trends.WeekdayTrends = trends.WeekdayTrends
                .OrderByDescending(t => Math.Abs(t.Trend))
                .ToList();
            
            return trends;
        }
    }
} 