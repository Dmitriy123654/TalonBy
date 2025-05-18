using BLL.Services;
using DAL;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;
using System.Text.Json.Serialization;

namespace TalonBy
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Добавьте эту конфигурацию в начало
            builder.WebHost.UseUrls(

                "http://localhost:5297",    // Основной URL для API

                "https://localhost:7297",   // HTTPS URL для API

                "http://localhost:5298"     // Отдельный URL для Swagger

            );
            // Add services to the container.


            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    // Отключаем сериализацию метаданных .NET
                    options.JsonSerializerOptions.ReferenceHandler = null;
                    options.JsonSerializerOptions.DefaultIgnoreCondition = 
                        System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
                });
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("DefaultPolicy",
                    builder =>
                    {
                        builder
                            .WithOrigins("http://localhost:4200")
                            .AllowCredentials()
                            .AllowAnyMethod()
                            .AllowAnyHeader();
                    });
            });
            builder.Services.AddSwaggerGen(c =>
            {
                //      JWT-
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme.",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer"
                });

                //      
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });


            builder.Services.AddDbContext<ApplicationContext>(options =>
                options.UseSqlServer(
                @"Server=(localdb)\mssqllocaldb;Database=TalonBy;Trusted_Connection=True;",
                x => x.MigrationsAssembly("DAL")));
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            string issuer = config["Jwt:Issuer"];
            string audience = config["Jwt:Audience"];
            string key = config["Jwt:Key"];

            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
                    };

                    // Извлекаем токен из cookie
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            context.Token = context.Request.Cookies["auth_token"];
                            return Task.CompletedTask;
                        }
                    };
                });

            //bll
            builder.Services.AddTransient<IAuthService, AuthService>();
            builder.Services.AddScoped<IDoctorService, DoctorService>();
            builder.Services.AddTransient<IDoctorsSpecialityService, DoctorsSpecialityService>();
            builder.Services.AddTransient<IHospitalService, HospitalService>();
            builder.Services.AddTransient<IMedicalAppointmentService, MedicalAppointmentService>();
            builder.Services.AddTransient<IPatientService, PatientService>();
            builder.Services.AddTransient<IReceptionStatusService, ReceptionStatusService>();
            builder.Services.AddScoped<IEmailService, EmailService>();
            builder.Services.AddScoped<IScheduleService,ScheduleService>();
            builder.Services.AddTransient<IAppointmentMedicalDetailsService, AppointmentMedicalDetailsService>();
            builder.Services.AddScoped<IStatisticsService, StatisticsService>();

            //dal
            builder.Services.AddTransient<IUserRepository, UserRepository>();
            builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();
            builder.Services.AddTransient<IDoctorsSpecialityRepository, DoctorsSpecialityRepository>();
            builder.Services.AddTransient<IHospitalRepository, HospitalRepository>();
            builder.Services.AddTransient<IMedicalAppointmentRepository, MedicalAppointmentRepository>();
            builder.Services.AddTransient<IReceptionStatusRepository, ReceptionStatusRepository>();
            builder.Services.AddTransient<IPatientRepository, PatientRepository>();
            builder.Services.AddScoped<IVerificationCodeRepository, VerificationCodeRepository>();
            builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();
            builder.Services.AddScoped<ITimeSlotRepository, TimeSlotRepository>();
            builder.Services.AddScoped<IDoctorScheduleSettingsRepository, DoctorScheduleSettingsRepository>();
            builder.Services.AddTransient<IAppointmentMedicalDetailsRepository, AppointmentMedicalDetailsRepository>();
            builder.Services.AddScoped<IAutoGenerationSettingsRepository, AutoGenerationSettingsRepository>();
            builder.Services.AddScoped<IStatisticsRepository, StatisticsRepository>();

            // Register PatientCard repositories and services
            builder.Services.AddScoped<IPatientCardRepository, PatientCardRepository>();
            builder.Services.AddScoped<IPatientAllergyRepository, PatientAllergyRepository>();
            builder.Services.AddScoped<IPatientChronicConditionRepository, PatientChronicConditionRepository>();
            builder.Services.AddScoped<IPatientImmunizationRepository, PatientImmunizationRepository>();
            builder.Services.AddScoped<IPatientCardService, PatientCardService>();

            // Создадим новый класс для запланированной очистки refresh токенов
            builder.Services.AddHostedService<BLL.Services.TokenCleanupService>();
            builder.Services.AddHostedService<TalonBy.Services.ScheduleGenerationBackgroundService>();


            var app = builder.Build();
            app.UseCors("DefaultPolicy");
            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TalonBy API V1");
                });
            }
            else 
            {
                app.UseHsts();
                app.UseHttpsRedirection();
            }

            app.Use(async (context, next) =>
            {
                context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
                context.Response.Headers.Add("X-Frame-Options", "DENY");
                context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
                context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
                context.Response.Headers.Add("Content-Security-Policy", 
                    "default-src 'self'; " +
                    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                    "style-src 'self' 'unsafe-inline';");
                
                await next();
            });

            app.UseCors("DefaultPolicy");
            app.UseAuthentication();
            app.UseAuthorization();
            


            app.MapControllers();

            app.Run();
        }
    }
}
