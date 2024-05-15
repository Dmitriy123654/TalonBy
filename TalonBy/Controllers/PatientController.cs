using BLL.Services;
using Domain;
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

        private int GetCurrentUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId);
        }
        // Методы контроллера будут добавлены здесь
    }
}
