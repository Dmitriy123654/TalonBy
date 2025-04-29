using BLL.Services;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace TalonBy.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppointmentMedicalDetailsController : ControllerBase
    {
        private readonly IAppointmentMedicalDetailsService _detailsService;

        public AppointmentMedicalDetailsController(IAppointmentMedicalDetailsService detailsService)
        {
            _detailsService = detailsService;
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Doctor,Admin")]
        public async Task<IActionResult> GetById(int id)
        {
            var details = await _detailsService.GetByIdAsync(id);
            if (details == null)
                return NotFound();

            return Ok(details);
        }

        [HttpGet("appointment/{appointmentId}")]
        [Authorize(Roles = "Doctor,Admin")]
        public async Task<IActionResult> GetByAppointmentId(int appointmentId)
        {
            var details = await _detailsService.GetByAppointmentIdAsync(appointmentId);
            if (details == null)
                return NotFound();

            return Ok(details);
        }

        [HttpPost]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> Create([FromBody] AppointmentMedicalDetailsModel model)
        {
            try
            {
                var details = await _detailsService.CreateAsync(model);
                return CreatedAtAction(nameof(GetById), new { id = details.AppointmentMedicalDetailsId }, details);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Doctor")]
        public async Task<IActionResult> Update(int id, [FromBody] AppointmentMedicalDetailsModel model)
        {
            try
            {
                var details = await _detailsService.UpdateAsync(id, model);
                return Ok(details);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Doctor,Admin")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _detailsService.DeleteAsync(id);
            if (!success)
                return NotFound();

            return NoContent();
        }
    }
} 