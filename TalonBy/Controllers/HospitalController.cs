using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TalonBy.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class HospitalController : Controller
    {
        private IHospitalService hospitalService;
        private IDoctorService doctorService;

        public HospitalController(IHospitalService hospitalService, IDoctorService doctorService)
        {
            this.hospitalService = hospitalService;
            this.doctorService = doctorService;
        }

        [Authorize]
        [HttpGet("GetAllHospitals")]
        public List<Hospital> GetAllHospitals()
        {
            var hospitals = hospitalService.GetAllHospitals();
            return hospitals;
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
            return Ok(doctors);
        }

        [HttpGet("GetDoctorsBySpecialty/{hospitalId}/{specialtyId}")]
        public IActionResult GetDoctorsBySpecialty(int hospitalId, int specialtyId)
        {
            var doctors = doctorService.GetDoctorsBySpecialtyAndHospital(hospitalId, specialtyId);
            return Ok(doctors);
        }

        [HttpGet("SearchHospitals")]
        public IActionResult SearchHospitals([FromQuery] HospitalSearchParameters parameters)
        {
            var hospitals = hospitalService.SearchHospitals(parameters);
            return Ok(hospitals);
        }
    }
}
