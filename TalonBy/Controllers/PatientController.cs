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
    [Route("api/patients")]
    public class PatientController : ControllerBase
    {
        private readonly IPatientService _patientService;

        public PatientController(IPatientService patientService)
        {
            _patientService = patientService;
        }

        [HttpPost]
        public async Task<IActionResult> AddPatient([FromBody] PatientModel patientModel)
        {
            try
            {
                var userId = GetCurrentUserId();
                var patient = await _patientService.AddPatientAsync(userId, patientModel);
                return Ok(patient);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatient(int id, [FromBody] PatientModel patientModel)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Проверяем, принадлежит ли пациент текущему пользователю
                var patients = await _patientService.GetPatientsByUserIdAsync(userId);
                var patient = patients.FirstOrDefault(p => p.PatientId == id);
                
                if (patient == null)
                {
                    return NotFound("Пациент не найден или не принадлежит текущему пользователю");
                }
                
                patientModel.PatientId = id;
                var updatedPatient = await _patientService.UpdatePatientAsync(userId, patientModel);
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

        [HttpGet("my")]
        public async Task<IActionResult> GetMyPatients()
        {
            try
            {
                var userId = GetCurrentUserId();
                var patients = await _patientService.GetPatientsByUserIdAsync(userId);
                return Ok(patients);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
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
        public async Task<IActionResult> GetPatient(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Проверяем права доступа
                var isAdmin = User.IsInRole("Administrator") || User.IsInRole("Doctor") || User.IsInRole("ChiefDoctor");
                
                // Если не администратор, проверяем принадлежность пациента
                if (!isAdmin)
                {
                    var patients = await _patientService.GetPatientsByUserIdAsync(userId);
                    var patient = patients.FirstOrDefault(p => p.PatientId == id);
                    
                    if (patient == null)
                    {
                        return NotFound("Пациент не найден или не принадлежит текущему пользователю");
                    }
                }
                
                var patientData = await _patientService.GetPatientByIdAsync(id);
                return Ok(patientData);
            }
            catch (Exception ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatient(int id)
        {
            try
            {
                // Проверяем права доступа
                var isAdmin = User.IsInRole("Administrator");
                var userId = GetCurrentUserId();
                
                // Если не администратор, проверяем принадлежность пациента
                if (!isAdmin)
                {
                    var patients = await _patientService.GetPatientsByUserIdAsync(userId);
                    var patient = patients.FirstOrDefault(p => p.PatientId == id);
                    
                    if (patient == null)
                    {
                        return NotFound("Пациент не найден или не принадлежит текущему пользователю");
                    }
                }
                
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
    }
}
