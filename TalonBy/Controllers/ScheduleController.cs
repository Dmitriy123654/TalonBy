using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using BLL.Services;


namespace TalonBy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;

        public ScheduleController(IScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
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