using BLL.Services;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace TalonBy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.Register(model);
            if (!result.Succeeded)
                return BadRequest(result.Errors);

            return Ok(new { message = "Registration successful" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.Login(model);
            if (!result.Succeeded)
                return BadRequest(new { message = "Invalid email or password" });

            return Ok(new { token = result.Token });
        }

        [Authorize]
        [HttpGet("GetThisUser")]
        public async Task<IActionResult> GetUser()
        {
            int userId = GetCurrentUserId();
            var user = await _authService.GetUserByIdAsync(userId);
            return Ok(user);
        }

        [Authorize]
        [HttpPut("update")]
        public async Task<IActionResult> UpdateUser(UpdateUserModel model)
        {
            var userId = GetCurrentUserId();
            var user = await _authService.GetUserByIdAsync(userId);
            if (user == null)
                return NotFound();

            user.Email = model.Email;
            user.Phone = model.Phone;
            // Обновите другие поля пользователя

            await _authService.UpdateUserAsync(user);
            return Ok(user);
        }

        /*[HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            *//*int userId = GetCurrentUserId();
            await _authService.LogoutAsync(userId);
            return NoContent();*//*
        }*/

        [Authorize]
        [HttpPost("CreatePatient")]
        public async Task<IActionResult> CreatePatient(PatientModel patientDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                var patient = await _authService.CreatePatientAsync(patientDto, userId);
                return Ok(patient);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [Authorize]
        private int GetCurrentUserId()
        {
            // Получаем идентификатор текущего пользователя из JWT токена
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId);
        }
    }
}
