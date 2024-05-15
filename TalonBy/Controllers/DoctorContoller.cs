using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel;

namespace TalonBy.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
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
            var doctors = await _doctorService.GetAllDoctorsAsync();
            return Ok(doctors);
        }

        [HttpGet("GetById {id}")]
        public async Task<IActionResult> GetDoctorById(int id)
        {
            var doctor = await _doctorService.GetDoctorByIdAsync(id);
            if (doctor == null)
                return NotFound();

            return Ok(doctor);
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
    }
}
