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
using BCrypt.Net;
using System.Collections.Generic;

namespace TalonBy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IAuthService authService, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _authService = authService;
            _configuration = configuration;
            _logger = logger;
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

            // Получаем полные данные пользователя
            var user = await _authService.GetUserByIdAsync(result.UserId);
            if (user == null)
                return BadRequest(new { message = "Ошибка при получении данных пользователя" });

            // Очистка устаревших токенов при логине
            try
            {
                var cleanedTokens = await _authService.CleanupExpiredRefreshTokensAsync();
                _logger.LogInformation($"Очищено {cleanedTokens} устаревших refresh токенов");
            }
            catch (Exception ex)
            {
                // Логируем ошибку, но не прерываем логин
                _logger.LogError(ex, "Ошибка при очистке токенов");
            }

            // Добавляем в клаймы полную информацию о пользователе
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString()),
                new Claim("Phone", user.Phone ?? "")
            };

            // Генерируем JWT токен с расширенными данными
            var token = GenerateJwtToken(claims);
            
            // Установим JWT токен в куки (для совместимости)
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Secure = false,  // Временно false для http в разработке
                SameSite = SameSiteMode.Lax,
                Expires = DateTime.UtcNow.AddDays(7)
            };

            Response.Cookies.Append("auth_token", token, cookieOptions);
            
            // Генерируем refresh токен
            var refreshToken = await _authService.GenerateRefreshTokenAsync(user.UserId);
            
            // Возвращаем только необходимые данные (без роли)
            return Ok(new { 
                token,
                refreshToken
            });
        }

        // Генерация JWT токена (перенесли из AuthService для использования в контроллере)
        private string GenerateJwtToken(Claim[] claims)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            // Create a dictionary to track already added claims
            var claimDict = new Dictionary<string, string>();
            var finalClaims = new List<Claim>();
            
            // Process claims to avoid duplicates
            foreach (var claim in claims)
            {
                // Use simple short claim names for better frontend integration
                string shortClaimName;
                
                // Map standard claim types to short names
                if (claim.Type == ClaimTypes.NameIdentifier) 
                    shortClaimName = "nameid";
                else if (claim.Type == ClaimTypes.Email) 
                    shortClaimName = "email";
                else if (claim.Type == ClaimTypes.Role) 
                    shortClaimName = "role";
                else 
                    shortClaimName = claim.Type;
                    
                // Only add if we haven't seen this claim type before
                if (!claimDict.ContainsKey(shortClaimName))
                {
                    claimDict[shortClaimName] = claim.Value;
                    finalClaims.Add(new Claim(shortClaimName, claim.Value));
                }
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(finalClaims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
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
                return NotFound("Пользователь не найден");

            user.Email = model.Email;
            user.Phone = model.Phone;
            // Обновите другие поля пользователя

            await _authService.UpdateUserAsync(user);
            return Ok(user);
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
        {
            // Удаляем куки с JWT токеном
            Response.Cookies.Delete("auth_token");
            
            // Если есть refresh токен, отзываем его
            if (request != null && !string.IsNullOrEmpty(request.RefreshToken))
            {
                await _authService.RevokeRefreshTokenAsync(request.RefreshToken);
            }
            
            return Ok(new { message = "Выход выполнен успешно" });
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
            try
            {
                // Simplified response as requested by the user
                return Ok(new { authenticated = true });
                
                // Uncomment if user info is needed in the future:
                /*
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = User.FindFirst(ClaimTypes.Email)?.Value;
                var role = User.FindFirst(ClaimTypes.Role)?.Value;
                
                return Ok(new { 
                    authenticated = true,
                    userId = int.Parse(userId),
                    email = email,
                    role = role
                });
                */
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка в GetCurrentUser");
                return Ok(new { authenticated = true });
            }
        }

        [Authorize]
        private int GetCurrentUserId()
        {
            // Получаем идентификатор текущего пользователя из JWT токена
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId);
        }

        [HttpGet("users")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _authService.GetAllUsersAsync();
                return Ok(users);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("users/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> GetUser(int id)
        {
            try
            {
                var user = await _authService.GetUserByIdAsync(id);
                if (user == null)
                {
                    return NotFound($"Пользователь с ID {id} не найден");
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("users/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserModel updateModel)
        {
            try
            {
                var user = await _authService.UpdateUserProfileAsync(id, updateModel);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpDelete("users/{id}")]
        [Authorize(Roles = "Administrator")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                if (!await _authService.UserExistsAsync(id))
                {
                    return NotFound($"Пользователь с ID {id} не найден");
                }
                
                await _authService.DeleteUserAsync(id);
                return Ok(new { message = "Пользователь успешно удален" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("profile")]
        [Authorize]
        public async Task<IActionResult> GetCurrentUserProfile()
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var user = await _authService.GetUserByIdAsync(userId);
                if (user == null)
                {
                    return NotFound("Пользователь не найден");
                }
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("profile")]
        [Authorize]
        public async Task<IActionResult> UpdateCurrentUserProfile([FromBody] UpdateUserModel updateModel)
        {
            try
            {
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var user = await _authService.UpdateUserProfileAsync(userId, updateModel);
                return Ok(user);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordModel model)
        {
            try
            {
                int userId = GetCurrentUserId();
                var user = await _authService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return NotFound("Пользователь не найден");
                }
                
                // Проверка текущего пароля
                if (!BCrypt.Net.BCrypt.Verify(model.CurrentPassword, user.Password))
                {
                    return BadRequest("Текущий пароль неверен");
                }
                
                // Обновление пароля
                user.Password = BCrypt.Net.BCrypt.HashPassword(model.NewPassword);
                await _authService.UpdateUserAsync(user);
                
                return Ok(new { message = "Пароль успешно изменен" });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
        {
            try
            {
                if (string.IsNullOrEmpty(request.RefreshToken))
                {
                    return BadRequest(new { message = "Некорректный refresh token" });
                }

                // Очистка устаревших токенов при обновлении токена
                try
                {
                    var cleanedTokens = await _authService.CleanupExpiredRefreshTokensAsync();
                    _logger.LogInformation($"Очищено {cleanedTokens} устаревших refresh токенов");
                }
                catch (Exception cleanupEx)
                {
                    // Логируем ошибку, но не прерываем обновление токена
                    _logger.LogError(cleanupEx, "Ошибка при очистке токенов");
                }

                // Get new tokens from auth service
                var (token, refreshToken) = await _authService.RefreshTokenAsync(request.RefreshToken);
                
                // Get updated user info
                var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var user = await _authService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return BadRequest(new { message = "Пользователь не найден" });
                }
                
                // Update token with the latest user data
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Role, user.Role.ToString()),
                    new Claim("Phone", user.Phone ?? "")
                };
                
                token = GenerateJwtToken(claims);
                
                // Return only tokens without redundant data (role, email, phone already in JWT)
                return Ok(new { 
                    token, 
                    refreshToken
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка обновления токена");
                return BadRequest(new { message = $"Ошибка обновления токена: {ex.Message}" });
            }
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

    // Добавляем класс для запроса обновления токена
    public class RefreshTokenRequest
    {
        public string RefreshToken { get; set; }
    }

    // Добавляем класс для запроса выхода
    public class LogoutRequest
    {
        public string RefreshToken { get; set; }
    }
}
