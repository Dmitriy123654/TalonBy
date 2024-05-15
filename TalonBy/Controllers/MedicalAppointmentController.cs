using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        [HttpPut("Update {id}")]
        public async Task<IActionResult> UpdateMedicalAppointment(int id, MedicalAppointmentModel model)
        {
            await _medicalAppointmentService.UpdateMedicalAppointmentAsync(id, model);
            return NoContent();
        }

        [HttpDelete("Delete {id}")]
        public async Task<IActionResult> DeleteMedicalAppointment(int id)
        {
            await _medicalAppointmentService.DeleteMedicalAppointmentAsync(id);
            return NoContent();
        }

        [HttpGet("GetById{id}")]
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
    }
}
