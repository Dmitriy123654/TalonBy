using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TalonBy.Controllers
{
    // [Authorize]  // Убираем этот атрибут для тестирования
    [ApiController]
    [Route("api/[controller]")]
    public class DoctorsSpecialityController : ControllerBase
    {
        private readonly IDoctorsSpecialityService _doctorsSpecialityService;

        public DoctorsSpecialityController(IDoctorsSpecialityService doctorsSpecialityService)
        {
            _doctorsSpecialityService = doctorsSpecialityService;

        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllDoctorsSpecialities()
        {
            var specialities = await _doctorsSpecialityService.GetAllDoctorsSpecialitiesAsync();
            return Ok(specialities);
        }

        [HttpGet("GetById {id}")]
        public async Task<IActionResult> GetDoctorsSpecialityById(int id)
        {
            var speciality = await _doctorsSpecialityService.GetDoctorsSpecialityByIdAsync(id);
            if (speciality == null)
                return NotFound();

            return Ok(speciality);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateDoctorsSpeciality(DoctorsSpecialityModel specialityModel)
        {
            var specialityId = await _doctorsSpecialityService.CreateDoctorsSpecialityAsync(specialityModel);
            return CreatedAtAction(nameof(GetDoctorsSpecialityById), new { id = specialityId }, specialityModel);
        }

        [HttpPut("Update {id}")]
        public async Task<IActionResult> UpdateDoctorsSpeciality(int id, DoctorsSpecialityModel specialityModel)
        {
            await _doctorsSpecialityService.UpdateDoctorsSpecialityAsync(id, specialityModel);
            return NoContent();
        }

        [HttpDelete("Delete {id}")]
        public async Task<IActionResult> DeleteDoctorsSpeciality(int id)
        {
            await _doctorsSpecialityService.DeleteDoctorsSpecialityAsync(id);
            return NoContent();
        }

        [HttpGet("GetByHospital/{hospitalId}")]
        public IActionResult GetByHospital(int hospitalId)
        {
            var specialities = _doctorsSpecialityService.GetSpecialitiesByHospital(hospitalId);
            return Ok(specialities);
        }
    }
}
