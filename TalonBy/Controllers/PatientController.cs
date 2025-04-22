using BLL.Services;
using Domain;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace TalonBy.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PatientController : ControllerBase
    {
        private readonly IPatientService _patientService;

        public PatientController(IPatientService patientService)
        {
            _patientService = patientService;
        }

        [HttpPut("UpdatePatient")]
        public IActionResult UpdatePatient(PatientModel patientUpdateModel)
        {
            try
            {
                var userId = GetCurrentUserId();
                var updatedPatient = _patientService.UpdatePatient(userId, patientUpdateModel);
                return Ok(updatedPatient);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetCurrentPatient()
        {
            try
            {
                var userId = GetCurrentUserId();
                var patient = await _patientService.GetPatientByUserIdAsync(userId);
                return Ok(patient);
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet]
        [Authorize(Roles = "Administrator,Doctor,ChiefDoctor")]
        public async Task<IActionResult> GetAllPatients()
        {
            try
            {
                var patients = await _patientService.GetAllPatientsAsync();
                return Ok(patients);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Administrator,Doctor,ChiefDoctor")]
        public async Task<IActionResult> GetPatient(int id)
        {
            try
            {
                var patient = await _patientService.GetPatientByIdAsync(id);
                return Ok(patient);
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            try
            {
                await _patientService.DeletePatientAsync(id);
                return Ok(new { message = "Пациент успешно удален" });
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("user/{userId}")]
        [Authorize(Roles = "Administrator,Doctor,ChiefDoctor")]
        public async Task<IActionResult> GetPatientsByUserId(int userId)
        {
            try
            {
                var patients = await _patientService.GetPatientsByUserIdAsync(userId);
                return Ok(patients);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId);
        }
        // Методы контроллера будут добавлены здесь
    }
}
