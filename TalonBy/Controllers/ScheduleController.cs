using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BLL.Services;
using Microsoft.Extensions.Logging;

namespace TalonBy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;
        private readonly ILogger<ScheduleController> _logger;

        public ScheduleController(IScheduleService scheduleService, ILogger<ScheduleController> logger)
        {
            _scheduleService = scheduleService;
            _logger = logger;
        }

        [HttpGet("settings/{doctorId}")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> GetDoctorScheduleSettings(int doctorId)
        {
            try
            {
                var settings = await _scheduleService.GetDoctorScheduleSettingsAsync(doctorId);
                if (settings == null)
                {
                    return NotFound("Настройки для указанного врача не найдены");
                }
                return Ok(settings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при получении настроек расписания: {ex.Message}");
            }
        }

        [HttpPost("settings")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> SaveDoctorScheduleSettings(ScheduleSettingsViewModel model)
        {
            try
            {
                var settings = await _scheduleService.SaveDoctorScheduleSettingsAsync(model);
                return Ok(settings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при сохранении настроек расписания: {ex.Message}");
            }
        }

        [HttpGet("{doctorId}")]
        [Authorize]
        public async Task<IActionResult> GetDoctorSchedule(int doctorId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var schedule = await _scheduleService.GetDoctorScheduleWithTimeSlotsAsync(doctorId, startDate, endDate);
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при получении расписания: {ex.Message}");
            }
        }

        [HttpPost("generate")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> GenerateSchedule(GenerateScheduleRequestViewModel request)
        {
            try
            {
                var success = await _scheduleService.GenerateScheduleAsync(request);
                if (success)
                {
                    var schedule = await _scheduleService.GetDoctorScheduleWithTimeSlotsAsync(
                        request.DoctorId,
                        request.StartDate,
                        request.EndDate
                    );
                    return Ok(schedule);
                }
                return BadRequest("Не удалось сгенерировать расписание");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при генерации расписания: {ex.Message}");
            }
        }

        [HttpGet("slots/{doctorId}")]
        [Authorize]
        public async Task<IActionResult> GetTimeSlots(int doctorId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var slots = await _scheduleService.GetDoctorTimeSlotsAsync(doctorId, startDate, endDate);
                return Ok(slots);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при получении слотов: {ex.Message}");
            }
        }

        [HttpPost("slots")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> CreateTimeSlot(TimeSlotViewModel slotDto)
        {
            try
            {
                var slot = await _scheduleService.CreateTimeSlotAsync(slotDto);
                return Ok(slot);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при создании слота: {ex.Message}");
            }
        }

        [HttpPatch("slots/{slotId}")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> UpdateSlotAvailability(int slotId, [FromBody] UpdateSlotViewModel model)
        {
            try
            {
                var slot = await _scheduleService.UpdateTimeSlotAsync(slotId, model);
                return Ok(slot);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при обновлении слота: {ex.Message}");
            }
        }

        [HttpDelete("slots/{slotId}")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> DeleteTimeSlot(int slotId)
        {
            try
            {
                await _scheduleService.DeleteTimeSlotAsync(slotId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при удалении слота: {ex.Message}");
            }
        }

        // Обновление группы слотов для конкретного дня
        [HttpPatch("{doctorId}/day/{date}")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> UpdateDaySchedule(int doctorId, DateTime date, [FromBody] List<UpdateSlotViewModel> slots)
        {
            try
            {
                var success = await _scheduleService.UpdateDayScheduleAsync(doctorId, date, slots);
                if (success)
                {
                    // Возвращаем обновленное расписание на этот день
                    var updatedSlots = await _scheduleService.GetDoctorTimeSlotsAsync(doctorId, date, date);
                    return Ok(updatedSlots);
                }
                return BadRequest("Не удалось обновить расписание");
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при обновлении расписания: {ex.Message}");
            }
        }

        // Автоматическая генерация расписания
        [HttpPost("generate-automatic")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> GenerateAutomaticSchedule([FromBody] AutomaticScheduleRequest request)
        {
            try
            {
                if (request == null || request.Settings == null)
                {
                    return BadRequest("Настройки расписания не могут быть пустыми");
                }

                var schedule = await _scheduleService.GenerateAutomaticScheduleAsync(
                    request.DoctorId, 
                    request.StartDate, 
                    request.EndDate, 
                    request.Settings
                );
                
                return Ok(schedule);
            }
            catch (ArgumentNullException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при автоматической генерации расписания: {ex.Message}");
            }
        }

        // Удаление расписания для указанного врача и периода
        [HttpDelete("{doctorId}")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> DeleteSchedule(int doctorId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                var success = await _scheduleService.DeleteScheduleAsync(doctorId, startDate, endDate);
                if (success)
                {
                    return Ok(true);
                }
                return BadRequest("Не удалось удалить расписание");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при удалении расписания: {ex.Message}");
            }
        }

        // Автоматическая генерация расписания для разных областей применения
        [HttpPost("auto-generate")]
        [Authorize(Roles = "ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> AutoGenerateSchedule([FromBody] AutoGenerateScheduleRequestViewModel request)
        {
            try
            {
                if (request == null || request.Settings == null)
                {
                    return BadRequest("Настройки расписания не могут быть пустыми");
                }
                
                if (string.IsNullOrEmpty(request.Scope))
                {
                    return BadRequest("Необходимо указать область применения");
                }
                
                // Добавляем проверки для разных областей
                switch (request.Scope)
                {
                    case "selectedHospital":
                        if (!request.HospitalId.HasValue)
                        {
                            return BadRequest("Для области 'selectedHospital' необходимо указать ID больницы");
                        }
                        break;
                        
                    case "selectedSpeciality":
                        if (!request.HospitalId.HasValue)
                        {
                            return BadRequest("Для области 'selectedSpeciality' необходимо указать ID больницы");
                        }
                        if (!request.SpecialityId.HasValue)
                        {
                            return BadRequest("Для области 'selectedSpeciality' необходимо указать ID специальности");
                        }
                        break;
                        
                    case "selectedDoctor":
                        if (!request.DoctorId.HasValue)
                        {
                            return BadRequest("Для области 'selectedDoctor' необходимо указать ID врача");
                        }
                        break;
                }
                
                var result = await _scheduleService.AutoGenerateScheduleAsync(request);
                
                // Анализируем результат
                if (result is Dictionary<string, object> resultDict && 
                    resultDict.TryGetValue("successCount", out var successCount) && 
                    resultDict.TryGetValue("totalCount", out var totalCount))
                {
                    int successCountInt = Convert.ToInt32(successCount);
                    int totalCountInt = Convert.ToInt32(totalCount);
                    
                    // Если не удалось создать ни одного расписания, но врачи были найдены
                    if (successCountInt == 0 && totalCountInt > 0)
                    {
                        return Ok(new {
                            totalCount = totalCountInt,
                            successCount = successCountInt,
                            scope = request.Scope,
                            startDate = request.StartDate.ToString("yyyy-MM-dd"),
                            endDate = request.EndDate.ToString("yyyy-MM-dd"),
                            message = "Не удалось создать ни одного расписания. Проверьте настройки и наличие врачей."
                        });
                    }
                }
                
                return Ok(result);
            }
            catch (ArgumentNullException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при автоматической генерации расписания: {ex.Message}");
            }
        }
        
        // Установка настроек для периодической автоматической генерации
        [HttpPost("auto-generate/settings")]
        [Authorize(Roles = "ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> SaveAutoGenerationSettings([FromBody] AutoGenerationSettingsViewModel model)
        {
            try
            {
                if (model == null || model.ScheduleSettings == null)
                {
                    return BadRequest("Настройки автоматической генерации не могут быть пустыми");
                }
                
                var settings = await _scheduleService.SaveAutoGenerationSettingsAsync(model);
                return Ok(settings);
            }
            catch (ArgumentNullException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при сохранении настроек автоматической генерации: {ex.Message}");
            }
        }
        
        // Получение настроек автоматической генерации для врача
        [HttpGet("auto-generate/settings/doctor/{doctorId}")]
        [Authorize(Roles = "Doctor,ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> GetAutoGenerationSettingsForDoctor(int doctorId)
        {
            try
            {
                var settings = await _scheduleService.GetAutoGenerationSettingsForDoctorAsync(doctorId);
                
                if (settings == null)
                {
                    return NotFound("Настройки автоматической генерации для врача не найдены");
                }
                
                return Ok(settings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при получении настроек автоматической генерации: {ex.Message}");
            }
        }
        
        // Отключение автоматической генерации
        [HttpDelete("auto-generate/settings/{settingsId}")]
        [Authorize(Roles = "ChiefDoctor,MedicalStaff,Administrator")]
        public async Task<IActionResult> DisableAutoGeneration(int settingsId)
        {
            try
            {
                var result = await _scheduleService.DisableAutoGenerationAsync(settingsId);
                
                if (result)
                {
                    return Ok(true);
                }
                
                return NotFound("Настройки автоматической генерации не найдены");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Ошибка при отключении автоматической генерации: {ex.Message}");
            }
        }
        
        // Получение всех активных настроек автоматической генерации (для админов)
        [HttpGet("auto-generate/settings")]
        [Authorize(Roles = "Administrator,ChiefDoctor,Doctor")]
        public async Task<ActionResult<IEnumerable<AutoGenerationSettingsViewModel>>> GetAutoGenerationSettings()
        {
            try
            {
                var settings = await _scheduleService.GetAllActiveAutoGenerationSettingsAsync();
                return Ok(settings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при получении настроек автоматической генерации");
                return StatusCode(500, "Ошибка при получении настроек автоматической генерации");
            }
        }
    }

    // DTO для запроса автоматической генерации
    public class AutomaticScheduleRequest
    {
        public int DoctorId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public ScheduleSettingsViewModel Settings { get; set; }
    }
} 