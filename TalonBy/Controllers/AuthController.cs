using BLL.Services;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.Extensions.Configuration;
using System.Text;
using System.Linq;
using Microsoft.Extensions.Logging;
using Domain.Models;
using Microsoft.AspNetCore.Http;

namespace TalonBy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;


        public AuthController(IAuthService authService, IConfiguration configuration)
        {
            _authService = authService;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterModel model)
        {
            var result = await _authService.Register(model);
            if (!result.Succeeded)
            {
                return BadRequest(result);
            }
            return Ok(new { message = "Код подтверждения отправлен на email" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel model)
        {
            var result = await _authService.Login(model);
            if (!result.Succeeded)
                return BadRequest(new { message = result.Message });

            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,  // Временно false для http в разработке
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append("auth_token", result.Token, cookieOptions);

            // Возвращаем пустой 200 OK
            return Ok();
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

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token");
            return Ok(new { message = "Logged out successfully" });
        }

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

        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailModel model)
        {
            var result = await _authService.VerifyEmail(model.Email, model.Code);
            if (!result.Succeeded)
            {
                return BadRequest(result);
            }
            return Ok(new { message = "Email подтвержден, регистрация завершена" });
        }

        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationModel model)
        {
            var result = await _authService.ResendVerificationCode(model.Email);
            if (!result.Succeeded)
            {
                return BadRequest(new { message = result.Message });
            }
            return Ok(new { message = "Код подтверждения отправлен повторно" });
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult GetCurrentUser()
        {
            // Минимум необходимой информации
            return Ok(new { authenticated = true });
        }

        [Authorize]
        private int GetCurrentUserId()
        {
            // Получаем идентификатор текущего пользователя из JWT токена
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId);
        }
    }

    public class AuthResponse
    {
        public string Message { get; set; }
    }

    public class LoginResponseDto
    {
        public string Email { get; set; }
    }
}
