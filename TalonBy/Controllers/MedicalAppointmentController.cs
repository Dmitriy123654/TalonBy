using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TalonBy.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/[controller]")]
    public class MedicalAppointmentController : ControllerBase
    {
        private readonly IMedicalAppointmentService _medicalAppointmentService;

        public MedicalAppointmentController(IMedicalAppointmentService medicalAppointmentService)
        {
            _medicalAppointmentService = medicalAppointmentService;
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateMedicalAppointment(MedicalAppointmentModel model)
        {
            var appointment = await _medicalAppointmentService.CreateMedicalAppointmentAsync(model);
            return CreatedAtAction(nameof(GetMedicalAppointmentById), new { id = appointment.MedicalAppointmentId }, appointment);
        }

        [HttpPost("CreateFromTimeSlot")]
        public async Task<IActionResult> CreateFromTimeSlot(int timeSlotId, int patientId, int receptionStatusId = 4)
        {
            try
            {
                var appointment = await _medicalAppointmentService.CreateAppointmentFromTimeSlotAsync(timeSlotId, patientId, receptionStatusId);
                return CreatedAtAction(nameof(GetMedicalAppointmentById), new { id = appointment.MedicalAppointmentId }, appointment);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("Update/{id}")]
        public async Task<IActionResult> UpdateMedicalAppointment(int id, MedicalAppointmentModel model)
        {
            try 
            {
                await _medicalAppointmentService.UpdateMedicalAppointmentAsync(id, model);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("Delete/{id}")]
        public async Task<IActionResult> DeleteMedicalAppointment(int id)
        {
            try 
            {
                await _medicalAppointmentService.DeleteMedicalAppointmentAsync(id);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("GetById/{id}")]
        public async Task<ActionResult<MedicalAppointment>> GetMedicalAppointmentById(int id)
        {
            var appointment = await _medicalAppointmentService.GetMedicalAppointmentByIdAsync(id);
            if (appointment == null)
                return NotFound();
            return appointment;
        }

        [HttpGet("GetByParameters")]
        public async Task<ActionResult<IEnumerable<MedicalAppointment>>> GetMedicalAppointments([FromQuery] MedicalAppointmentSearchParameters parameters)
        {
            var appointments = await _medicalAppointmentService.GetMedicalAppointmentsAsync(parameters);
            return Ok(appointments);
        }
        
        [HttpGet("GetByPatientId/{patientId}")]
        public async Task<ActionResult<IEnumerable<MedicalAppointment>>> GetByPatientId(int patientId)
        {
            var appointments = await _medicalAppointmentService.GetMedicalAppointmentsByPatientIdAsync(patientId);
            return Ok(appointments);
        }
        
        [HttpGet("GetByPatientCardId/{patientCardId}")]
        public async Task<ActionResult<IEnumerable<MedicalAppointment>>> GetByPatientCardId(int patientCardId)
        {
            var appointments = await _medicalAppointmentService.GetMedicalAppointmentsByPatientCardIdAsync(patientCardId);
            return Ok(appointments);
        }
        
        [HttpPut("UpdatePatientCard/{appointmentId}")]
        public async Task<IActionResult> UpdatePatientCard(int appointmentId, [FromBody] int patientCardId)
        {
            try
            {
                await _medicalAppointmentService.UpdateAppointmentPatientCardAsync(appointmentId, patientCardId);
                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
