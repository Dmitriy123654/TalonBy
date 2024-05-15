using BLL.Services;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace TalonBy.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ReceptionStatusController : ControllerBase
    {
        private readonly IReceptionStatusService _receptionStatusService;

        public ReceptionStatusController(IReceptionStatusService receptionStatusService)
        {
            _receptionStatusService = receptionStatusService;
        }

        [HttpGet("GetAll")]
        public async Task<IActionResult> GetAllReceptionStatuses()
        {
            var receptionStatuses = await _receptionStatusService.GetAllReceptionStatusesAsync();
            return Ok(receptionStatuses);
        }

        [HttpGet("GetById{id}")]
        public async Task<IActionResult> GetReceptionStatusById(int id)
        {
            var receptionStatus = await _receptionStatusService.GetReceptionStatusByIdAsync(id);
            if (receptionStatus == null)
                return NotFound();

            return Ok(receptionStatus);
        }

        [HttpGet("GetByStatus {status}")]
        public async Task<IActionResult> GetReceptionStatusByStatus(Domain.Status status)
        {
            var receptionStatus = await _receptionStatusService.GetReceptionStatusByStatusAsync(status);
            if (receptionStatus == null)
                return NotFound();

            return Ok(receptionStatus);
        }

        [HttpPost("Create")]
        public async Task<IActionResult> CreateReceptionStatus(ReceptionStatusModel receptionStatusModel)
        {
            await _receptionStatusService.CreateReceptionStatusAsync(receptionStatusModel);
            return Ok();
        }

        [HttpPut("Update")]
        public async Task<IActionResult> UpdateReceptionStatus(ReceptionStatusModel receptionStatusModel)
        {
            try
            {
                await _receptionStatusService.UpdateReceptionStatusAsync(receptionStatusModel);
                return Ok();
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("Delete {id}")]
        public async Task<IActionResult> DeleteReceptionStatus(int id)
        {
            await _receptionStatusService.DeleteReceptionStatusAsync(id);
            return Ok();
        }
    }
}
