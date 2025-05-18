using BLL.Services;
using Domain.ViewModels.Statistics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace TalonBy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class StatisticsController : ControllerBase
    {
        private readonly IStatisticsService _statisticsService;
        private readonly ILogger<StatisticsController> _logger;

        public StatisticsController(IStatisticsService statisticsService, ILogger<StatisticsController> logger)
        {
            _statisticsService = statisticsService;
            _logger = logger;
        }

        /// <summary>
        /// Получение статистики по расписанию
        /// </summary>
        /// <param name="scope">Область статистики</param>
        /// <param name="period">Период статистики</param>
        /// <param name="hospitalId">Идентификатор больницы (если применимо)</param>
        /// <param name="specialtyId">Идентификатор специальности (если применимо)</param>
        /// <param name="doctorId">Идентификатор врача (если применимо)</param>
        /// <param name="startFromToday">Начинать период с сегодняшнего дня</param>
        /// <returns>Данные статистики расписания</returns>
        [HttpGet("schedule")]
        [Authorize(Roles = "Administrator,ChiefDoctor,Doctor")]
        public async Task<ActionResult<ScheduleStatisticsViewModel>> GetScheduleStatistics(
            [FromQuery] StatisticsScopeEnum scope,
            [FromQuery] StatisticsPeriodEnum period,
            [FromQuery] int? hospitalId = null,
            [FromQuery] int? specialtyId = null,
            [FromQuery] int? doctorId = null,
            [FromQuery] bool startFromToday = false)
        {
            try
            {
                var request = new StatisticsRequestViewModel
                {
                    Scope = scope,
                    Period = period,
                    HospitalId = hospitalId,
                    SpecialtyId = specialtyId,
                    DoctorId = doctorId,
                    StartFromToday = startFromToday
                };
                
                var result = await _statisticsService.GetScheduleStatisticsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении статистики по расписанию");
                return StatusCode(500, "Ошибка при получении статистики по расписанию");
            }
        }

        /// <summary>
        /// Получение статистики по доступности слотов для конкретного врача
        /// </summary>
        /// <param name="doctorId">Идентификатор врача</param>
        /// <param name="fromDate">Начальная дата</param>
        /// <param name="toDate">Конечная дата</param>
        /// <returns>Статистика по доступности слотов</returns>
        [HttpGet("doctor/{doctorId}/slots")]
        [Authorize(Roles = "Administrator,ChiefDoctor,Doctor")]
        public async Task<ActionResult<ScheduleStatisticsViewModel>> GetDoctorSlotStatistics(
            int doctorId,
            [FromQuery] DateTime fromDate,
            [FromQuery] DateTime toDate)
        {
            try
            {
                var statistics = await _statisticsService.GetSlotAvailabilityStatisticsAsync(doctorId, fromDate, toDate);
                return Ok(statistics);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }

        /// <summary>
        /// Получение статистики по загруженности больницы
        /// </summary>
        /// <param name="hospitalId">Идентификатор больницы</param>
        /// <param name="period">Период статистики</param>
        /// <returns>Статистика по загруженности больницы</returns>
        [HttpGet("hospital/{hospitalId}/occupancy")]
        [Authorize(Roles = "Administrator,ChiefDoctor")]
        public async Task<ActionResult<ScheduleStatisticsViewModel>> GetHospitalOccupancyStatistics(
            int hospitalId,
            [FromQuery] string period)
        {
            try
            {
                // Преобразование строкового параметра в enum
                if (!Enum.TryParse<StatisticsPeriodEnum>(period, true, out var parsedPeriod))
                {
                    return BadRequest("Неверное значение для параметра 'period'.");
                }

                var statistics = await _statisticsService.GetHospitalOccupancyStatisticsAsync(hospitalId, parsedPeriod);
                return Ok(statistics);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Внутренняя ошибка сервера: {ex.Message}");
            }
        }
    }
} 