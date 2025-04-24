using BLL.Services;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Text.Json;

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
                
                // Проекция данных пациентов на упрощенную модель для клиента
                var simplifiedPatients = patients.Select(p => new {
                    patientId = p.PatientId,
                    name = p.Name,
                    gender = p.Gender,
                    dateOfBirth = p.DateOfBirth.Date, // Только дата без времени
                    address = p.Address,
                }).ToList();
                
                // Отправляем только необходимые данные для работы без идентифицирующей информации
                // Уникальные идентификаторы передавать не будем
                var response = new {
                    items = simplifiedPatients.Count,
                    patients = simplifiedPatients
                };

                // Информацию о пользователе устанавливаем в заголовки
                Response.Headers.Add("X-User-Role", user.Role.ToString());
                
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
                
                // Проекция данных пациентов на упрощенную модель для клиента
                var simplifiedPatients = patients.Select(p => new {
                    patientId = p.PatientId,
                    name = p.Name,
                    gender = p.Gender,
                    dateOfBirth = p.DateOfBirth.Date, // Только дата без времени
                    address = p.Address,
                }).ToList();
                
                // Отправляем только необходимые данные для работы без идентифицирующей информации
                var response = new {
                    updated = true,
                    items = simplifiedPatients.Count,
                    patients = simplifiedPatients
                };

                // Информацию о пользователе устанавливаем в заголовки
                Response.Headers.Add("X-User-Role", user.Role.ToString());
                Response.Headers.Add("X-User-Updated", "true");
                
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