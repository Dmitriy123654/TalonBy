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
            
            // Рассчитываем занятость (загруженность для выполненных)
            if (timeSlots.Count > 0)
            {
                result.OccupancyRate = Math.Round((double)result.CompletedAppointments / timeSlots.Count * 100, 2);
            }
            
            // Расчет почасового распределения
            result.HourlyDistribution = CalculateHourlyDistribution(appointments);
            
            // Расчет распределения по дням недели
            result.WeekdayDistribution = CalculateWeekdayDistribution(appointments, timeSlots);
            
            return result;
        }

        /// <summary>
        /// Расчет распределения записей по дням недели
        /// </summary>
        /// <param name="appointments">Записи на прием</param>
        /// <param name="timeSlots">Временные слоты</param>
        /// <returns>Рассчитанное распределение по дням недели</returns>
        private List<WeekdayDistributionViewModel> CalculateWeekdayDistribution(List<MedicalAppointment> appointments, List<TimeSlot> timeSlots)
        {
            var result = new List<WeekdayDistributionViewModel>();
            
            // Словарь с информацией о количестве слотов по дням недели
            var slotsByDayOfWeek = timeSlots
                .GroupBy(slot => ((DateTime)slot.Date).DayOfWeek)
                .ToDictionary(
                    g => GetDayOfWeekNumber(g.Key), 
                    g => g.Count()
                );
            
            // Группируем приемы по дням недели
            var groupedByDayOfWeek = appointments
                .Where(a => a.Date != null)
                .GroupBy(a => ((DateTime)a.Date).DayOfWeek)
                .Select(g => new
                {
                    DayOfWeek = GetDayOfWeekNumber(g.Key),
                    TotalCount = g.Count(),
                    CompletedCount = g.Count(a => a.ReceptionStatusId == 2),
                    WaitingCount = g.Count(a => a.ReceptionStatusId == 4),
                    CancelledCount = g.Count(a => a.ReceptionStatusId == 5)
                })
                .ToList();
            
            // Формируем данные для всех дней недели
            for (int i = 1; i <= 7; i++)
            {
                var dayInfo = groupedByDayOfWeek.FirstOrDefault(d => d.DayOfWeek == i);
                
                var weekdayData = new WeekdayDistributionViewModel
                {
                    DayOfWeek = i,
                    Name = GetDayOfWeekName(i),
                    TotalAppointments = dayInfo?.TotalCount ?? 0,
                    CompletedAppointments = dayInfo?.CompletedCount ?? 0,
                    WaitingAppointments = dayInfo?.WaitingCount ?? 0,
                    CancelledAppointments = dayInfo?.CancelledCount ?? 0,
                    Rate = 0 // Значение по умолчанию
                };
                
                // Если есть информация о количестве слотов, рассчитываем загруженность
                if (slotsByDayOfWeek.TryGetValue(i, out var slotsCount) && slotsCount > 0)
                {
                    weekdayData.Rate = Math.Round((double)weekdayData.CompletedAppointments / slotsCount * 100, 2);
                }
                
                result.Add(weekdayData);
            }
            
            return result;
        }
        
        /// <summary>
        /// Преобразование DayOfWeek в числовой формат (1-7, где 1 - понедельник, 7 - воскресенье)
        /// </summary>
        private static int GetDayOfWeekNumber(DayOfWeek dayOfWeek)
        {
            // В .NET DayOfWeek: 0 - воскресенье, 1 - понедельник, и т.д.
            // Преобразуем в 1 - понедельник, ... 7 - воскресенье
            return dayOfWeek == DayOfWeek.Sunday ? 7 : (int)dayOfWeek;
        }
        
        /// <summary>
        /// Получение названия дня недели по его номеру
        /// </summary>
        private static string GetDayOfWeekName(int dayOfWeek)
        {
            string[] dayNames = {"ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ", "ВС"};
            return dayNames[dayOfWeek - 1];
        }

        /// <summary>
        /// Расчет почасового распределения записей
        /// </summary>
        /// <param name="appointments">Записи на прием</param>
        /// <returns>Рассчитанное почасовое распределение</returns>
        private List<HourlyDistributionViewModel> CalculateHourlyDistribution(List<MedicalAppointment> appointments)
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

            // Преобразуем в список HourlyDistributionViewModel с расширенными данными
            return hourlyDistribution
                .Select(kv => new HourlyDistributionViewModel
                {
                    Hour = kv.Key,
                    TotalAppointments = kv.Value.completedAppointments + kv.Value.waitingAppointments + kv.Value.cancelledAppointments,
                    CompletedAppointments = kv.Value.completedAppointments,
                    WaitingAppointments = kv.Value.waitingAppointments,
                    CancelledAppointments = kv.Value.cancelledAppointments,
                    Rate = kv.Value.total > 0 ? 
                        (double)(kv.Value.completedAppointments + kv.Value.waitingAppointments + kv.Value.cancelledAppointments) / kv.Value.total * 100 : 0
                })
                .OrderBy(h => h.Hour)
                .ToList();
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
    }
} 