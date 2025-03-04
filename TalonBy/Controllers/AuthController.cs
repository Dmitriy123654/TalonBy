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
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var result = await _authService.Login(model);
            if (!result.Succeeded)
                return BadRequest(new { message = result.Message });

            if (result.UserId == null || result.Email == null || result.Role == null)
            {
                return BadRequest(new { message = "Invalid login result." });
            }

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, result.UserId.ToString()),
                new Claim(ClaimTypes.Email, result.Email),
                new Claim(ClaimTypes.Role, result.Role.ToString())
            };

            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);

            return Ok(new { token = tokenString });
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
        private int GetCurrentUserId()
        {
            // Получаем идентификатор текущего пользователя из JWT токена
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId);
        }
    }
}
