using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel;

namespace TalonBy.Controllers
{
    // [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    [Route("api/doctors")]
    public class DoctorController : ControllerBase
    {
        private readonly IDoctorService _doctorService;

        public DoctorController(IDoctorService doctorService)
        {
            _doctorService = doctorService;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllDoctors()
        {
            try
            {
                // Use the new simplified method that avoids circular references
                var doctors = await _doctorService.GetAllDoctorsSimplifiedAsync();
            return Ok(doctors);
            }
            catch (Exception ex)
            {
                // Log the exception details (in production, use proper logging)
                Console.WriteLine($"Error in GetAllDoctors: {ex.Message}");
                Console.WriteLine($"Stack trace: {ex.StackTrace}");
                
                return StatusCode(500, new { message = "Произошла ошибка при получении списка врачей", error = ex.Message });
            }
        }

        [HttpGet("GetById {id}")]
        public async Task<IActionResult> GetDoctorById(int id)
        {
            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            if (doctor == null)
                return NotFound();

            return Ok(doctor);
        }
        [HttpGet("GetBySpeciality/{specialityId}")]
        public async Task<IActionResult> GetDoctorsBySpeciality(int specialityId)
        {
            try
            {
                var doctors = await _doctorService.GetDoctorsBySpecialityAsync(specialityId);
                return Ok(doctors);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("GetByHospital/{hospitalId}")]
        public IActionResult GetDoctorsByHospital(int hospitalId)
        {
            try
            {
                var doctors = _doctorService.GetDoctorsByHospital(hospitalId);
                return Ok(doctors);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("GetBySpecialtyAndHospital/{hospitalId}/{specialtyId}")]
        public IActionResult GetDoctorsBySpecialtyAndHospital(int hospitalId, int specialtyId)
        {
            try
            {
                var doctors = _doctorService.GetDoctorsBySpecialtyAndHospital(hospitalId, specialtyId);
                
                // Преобразуем результат в упрощенный формат без циклических ссылок
                var simplifiedDoctors = doctors.Select(d => new {
                    doctorId = d.DoctorId,
                    fullName = d.FullName,
                    doctorsSpeciality = new {
                        name = d.DoctorsSpeciality?.Name,
                        doctorsSpecialityId = d.DoctorsSpeciality?.DoctorsSpecialityId
                    },
                    photo = d.Photo,
                    hospitalId = d.HospitalId,
                    workingHours = d.WorkingHours,
                    office = d.Office,
                    additionalInfo = d.AdditionalInfo
                });
                
                return Ok(simplifiedDoctors);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateDoctor(DoctorModel doctorModel)
        {
            await _doctorService.CreateDoctorAsync(doctorModel);
            return Ok();
        }

        [HttpPut("Update {id}")]
        public async Task<IActionResult> UpdateDoctor(int id, DoctorModel doctorModel)
        {
            await _doctorService.UpdateDoctorAsync(id, doctorModel);
            return Ok();
        }

        [HttpDelete("Delete {id}")]
        public async Task<IActionResult> DeleteDoctor(int id)
        {
            await _doctorService.DeleteDoctorAsync(id);
            return Ok();
        }

        /// <summary>
        /// Получение информации о главном враче по ID пользователя
        /// </summary>
        [HttpGet("chief/{userId}")]
        public async Task<IActionResult> GetChiefDoctorByUserId(string userId)
        {
            try
            {
                var doctorInfo = await _doctorService.GetChiefDoctorByUserIdAsync(userId);
                if (doctorInfo == null)
                {
                    return NotFound(new { message = "Информация о главном враче не найдена" });
                }
                
                return Ok(doctorInfo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Получение информации о враче по ID пользователя
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetDoctorByUserId(string userId)
        {
            try
            {
                var doctorInfo = await _doctorService.GetDoctorByUserIdAsync(userId);
                if (doctorInfo == null)
                {
                    return NotFound(new { message = "Информация о враче не найдена" });
                }
                
                return Ok(doctorInfo);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
