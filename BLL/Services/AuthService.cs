using Domain.Models;
using Microsoft.Extensions.Configuration;
using Domain.ViewModels;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Domain.Interfaces;
using Domain;
using Microsoft.Extensions.Logging;

namespace BLL.Services
{
    public interface IAuthService
    {
        Task<Result> Register(RegisterModel model);
        Task<LoginResult> Login(LoginModel model);
        Task<User> GetUserByIdAsync(int userId);
        Task UpdateUserAsync(User user);
        Task<Patient> CreatePatientAsync(PatientModel patientDto, int PatientId);
    }

    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(IUserRepository userRepository, IConfiguration configuration, ILogger<AuthService> logger)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<Result> Register(RegisterModel model)
        {
            // Проверка наличия пользователя с таким же email
            if (await _userRepository.GetByEmail(model.Email) != null)
            {
                return new Result { Succeeded = false, Errors = new[] { "User with this email already exists" } };
            }
            
            // Создание нового пользователя
            var user = new User
            {
                Email = model.Email,
                Phone = model.Phone,
                Password = BCrypt.Net.BCrypt.HashPassword(model.Password),
                Role = RoleOfUser.Patient
            };

            await _userRepository.Create(user);

            return new Result { Succeeded = true };
        }

        public async Task<LoginResult> Login(LoginModel model)
        {
            var user = await _userRepository.GetByEmail(model.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.Password))
            {
                return new LoginResult { Succeeded = false };
            }

            var token = GenerateJwtToken(user);

            // Логирование значений
            _logger.LogInformation($"UserId: {user.UserId}, Email: {user.Email}, Role: {user.Role}");

            return new LoginResult
            {
                Succeeded = true,
                Token = token,
                UserId = user.UserId,
                Email = user.Email,
                Role = user.Role
            };
        }

        public async Task<User> GetUserByIdAsync(int userId)
        {
            return await _userRepository.GetUserByIdAsync(userId);
        }

        public async Task UpdateUserAsync(User user)
        {
            await _userRepository.UpdateUserAsync(user);
        }

        public async Task<Patient> CreatePatientAsync(PatientModel patientDto, int userId)
        {
            var patient = new Patient
            {
                Name = patientDto.Name,
                Gender = patientDto.Gender,
                DateOfBirth = patientDto.DateOfBirth,
                Address = patientDto.Address,
                UserId = userId
            };

            return await _userRepository.CreatePatientAsync(patient);
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
