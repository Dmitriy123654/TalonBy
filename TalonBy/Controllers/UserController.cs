using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace TalonBy.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IPatientService _patientService;

        public UserController(IAuthService authService, IPatientService patientService)
        {
            _authService = authService;
            _patientService = patientService;
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                int userId = GetCurrentUserId();
                var user = await _authService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return NotFound("Пользователь не найден");
                }

                // Получаем пациентов пользователя
                var patients = await _patientService.GetPatientsByUserIdAsync(userId);
                
                Console.WriteLine($"Fetched {patients.Count} patients for user {userId}");
                
                // Формируем объект для ответа
                var response = new
                {
                    userId = user.UserId,
                    email = user.Email,
                    phone = user.Phone,
                    patients = patients
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserModel userModel)
        {
            try
            {
                int userId = GetCurrentUserId();
                var user = await _authService.GetUserByIdAsync(userId);
                
                if (user == null)
                {
                    return NotFound("Пользователь не найден");
                }
                
                // Обновляем данные пользователя
                user.Email = userModel.Email ?? user.Email;
                user.Phone = userModel.Phone ?? user.Phone;
                
                // Сохраняем изменения
                await _authService.UpdateUserAsync(user);
                
                // Получаем обновленных пациентов пользователя
                var patients = await _patientService.GetPatientsByUserIdAsync(userId);
                
                // Формируем объект для ответа
                var response = new
                {
                    userId = user.UserId,
                    email = user.Email,
                    phone = user.Phone,
                    patients = patients
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        private int GetCurrentUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId);
        }
    }
} 