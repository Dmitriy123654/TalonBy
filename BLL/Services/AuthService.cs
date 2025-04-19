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
using System.Security.Cryptography;

namespace BLL.Services
{
    public interface IAuthService
    {
        Task<Result> Register(RegisterModel model);
        Task<LoginResult> Login(LoginModel model);
        Task<User> GetUserByIdAsync(int userId);
        Task UpdateUserAsync(User user);
        Task<Patient> CreatePatientAsync(PatientModel patientDto, int PatientId);
        Task<bool> VerifyCode(string contact, string code, bool isEmail);
        Task<Result> VerifyUser(string contact, string code, bool isEmail);
        Task<Result> VerifyEmail(string email, string code);
        Task<Result> ResendVerificationCode(string email);
        string GenerateVerificationCode();
    }

    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IEmailService _emailService;
        private readonly IVerificationCodeRepository _verificationRepository;

        public AuthService(IUserRepository userRepository, IConfiguration configuration, ILogger<AuthService> logger, IEmailService emailService, IVerificationCodeRepository verificationRepository)
        {
            _userRepository = userRepository;
            _configuration = configuration;
            _logger = logger;
            _emailService = emailService;
            _verificationRepository = verificationRepository;
        }

        public async Task<Result> Register(RegisterModel model)
        {
            var existingUser = await _userRepository.GetByEmail(model.Email);
            if (existingUser != null)
            {
                return new Result { Succeeded = false, Message = "Пользователь с таким email уже существует" };
            }

            var code = GenerateVerificationCode();
            var verificationCode = new VerificationCode
            {
                Email = model.Email,
                Password = model.Password, // Сохраняем пароль без хеширования
                Phone = model.Phone,
                Code = code,
                ExpirationTime = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false
            };
            
            await _verificationRepository.SaveCode(verificationCode);

            // Асинхронная отправка email
            _ = Task.Run(async () =>
            {
                var subject = "Подтверждение email";
                var body = $@"
                    <h2>Подтверждение регистрации</h2>
                    <p>Ваш код подтверждения: <strong>{code}</strong></p>
                    <p>Код действителен в течение 15 минут.</p>";

                await _emailService.SendEmailAsync(model.Email, subject, body);
            });

            return new Result { Succeeded = true };
        }

        public async Task<LoginResult> Login(LoginModel model)
        {
            var user = await _userRepository.GetByEmail(model.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(model.Password, user.Password))
            {
                return new LoginResult { Succeeded = false, Message = "Неверный email или пароль" };
            }

            // Создаем claims для JWT
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToString())
            };

            // Генерируем JWT токен
            var token = GenerateJwtToken(claims);

            return new LoginResult
            {
                Succeeded = true,
                Token = token,
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

        private string GenerateJwtToken(Claim[] claims)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"]);
            var issuer = _configuration["Jwt:Issuer"];
            var audience = _configuration["Jwt:Audience"];

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = issuer,
                Audience = audience,
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public async Task<bool> VerifyCode(string contact, string code, bool isEmail)
        {
            // Проверьте код, который был отправлен на email или телефон
            // Если код верный, обновите поля IsEmailVerified или IsPhoneVerified
            return false; // Placeholder return, actual implementation needed
        }

        public async Task<Result> VerifyUser(string contact, string code, bool isEmail)
        {
            var isVerified = await VerifyCode(contact, code, isEmail);
            if (isVerified)
            {
                // Обновите пользователя
                var user = await _userRepository.GetByEmail(contact); // или по телефону
                if (isEmail)
                {
                    user.IsEmailVerified = true;
                }
                else
                {
                    user.IsPhoneVerified = true;
                }
                await _userRepository.UpdateUserAsync(user);
                return new Result { Succeeded = true };
            }
            return new Result { Succeeded = false, Errors = new[] { "Неверный код подтверждения" } };
        }

        public string GenerateVerificationCode()
        {
            // Генерируем 6-значный код
            return new Random().Next(100000, 999999).ToString();
        }

        public async Task<Result> VerifyEmail(string email, string code)
        {
            var verificationCode = await _verificationRepository.GetLatestCode(email);
            if (verificationCode == null || verificationCode.IsUsed || verificationCode.ExpirationTime < DateTime.UtcNow)
            {
                return new Result { Succeeded = false, Message = "Недействительный код подтверждения" };
            }

            if (verificationCode.Code != code)
            {
                return new Result { Succeeded = false, Message = "Неверный код подтверждения" };
            }

            // Создаем пользователя из сохраненных данных
            var user = new User
            {
                Email = verificationCode.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(verificationCode.Password),
                Phone = verificationCode.Phone,
                Role = RoleOfUser.Patient,
                IsEmailVerified = true,
                IsPhoneVerified = false
            };

            await _userRepository.Create(user);

            // Помечаем код как использованный
            verificationCode.IsUsed = true;
            await _verificationRepository.UpdateCode(verificationCode);

            return new Result { Succeeded = true };
        }

        public async Task<Result> ResendVerificationCode(string email)
        {
            var lastVerificationCode = await _verificationRepository.GetLatestCode(email);
            if (lastVerificationCode == null)
            {
                return new Result { Succeeded = false, Message = "Не найдена информация о регистрации" };
            }

            var code = GenerateVerificationCode();
            var verificationCode = new VerificationCode
            {
                Email = lastVerificationCode.Email,
                Password = lastVerificationCode.Password,
                Phone = lastVerificationCode.Phone,
                Code = code,
                ExpirationTime = DateTime.UtcNow.AddMinutes(15),
                IsUsed = false
            };
            
            await _verificationRepository.SaveCode(verificationCode);

            // Отправляем email
            var subject = "Подтверждение email";
            var body = $@"
                <h2>Подтверждение регистрации</h2>
                <p>Ваш новый код подтверждения: <strong>{code}</strong></p>
                <p>Код действителен в течение 15 минут.</p>";

            await _emailService.SendEmailAsync(email, subject, body);

            return new Result { Succeeded = true };
        }
    }
}
