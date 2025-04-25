using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TalonBy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HospitalController : ControllerBase
    {
        private IHospitalService hospitalService;
        private IDoctorService doctorService;

        public HospitalController(IHospitalService hospitalService, IDoctorService doctorService)
        {
            this.hospitalService = hospitalService;
            this.doctorService = doctorService;
        }

        [AllowAnonymous]
        [HttpGet("GetAllHospitals")]
        public async Task<IActionResult> GetAllHospitals()
        {
            var hospitals = hospitalService.GetAllHospitals();
            return Ok(hospitals);
        }

        [HttpGet("GetById/{id}")]
        public IActionResult GetById(int id)
        {
            var hospital = hospitalService.GetById(id);
            if (hospital == null)
                return NotFound();

            return Ok(hospital);
        }

        [HttpPost("Create")]
        public IActionResult Add(HospitalModel hospitalDTO)
        {
            hospitalService.Add(hospitalDTO);
            return Ok();
        }

        [HttpPut("Update/{id}")]
        public IActionResult Update(HospitalModel hospitalModel, int id)
        {
            hospitalService.Update(hospitalModel, id);
            return Ok();
        }

        [HttpDelete("Delete/{id}")]
        public IActionResult Delete(int id)
        {
            hospitalService.Delete(id);
            return Ok();
        }

        [HttpGet("GetDoctorsByHospital/{hospitalId}")]
        public IActionResult GetDoctorsByHospital(int hospitalId)
        {
            var doctors = doctorService.GetDoctorsByHospital(hospitalId);
            
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

        [HttpGet("GetDoctorsBySpecialty/{hospitalId}/{specialtyId}")]
        public IActionResult GetDoctorsBySpecialty(int hospitalId, int specialtyId)
        {
            var doctors = doctorService.GetDoctorsBySpecialtyAndHospital(hospitalId, specialtyId);
            
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

        [HttpGet("SearchHospitals")]
        public IActionResult SearchHospitals([FromQuery] HospitalSearchParameters parameters)
        {
            var hospitals = hospitalService.SearchHospitals(parameters);
            return Ok(hospitals);
        }
    }
}
