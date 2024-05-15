
using BLL.Services;
using DAL;
using Domain.Interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;


namespace TalonBy
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // Add services to the container.

        
            builder.Services.AddControllers()
                .AddJsonOptions(options =>
                {
                    options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.Preserve;
                });
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();

            builder.Services.AddSwaggerGen(c =>
            {
                // Добавьте определение безопасности для использования JWT-токена
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "JWT Authorization header using the Bearer scheme.",
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer"
                });

                // Добавьте требование безопасности для всех методов
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
                           ValidIssuer = issuer,
                           ValidAudience = audience,
                           RoleClaimType = ClaimTypes.Role,
                           IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
                       };
                   });

            //bll
            builder.Services.AddTransient<IAuthService, AuthService>();
            builder.Services.AddTransient<IDoctorService, DoctorService>();
            builder.Services.AddTransient<IDoctorsSpecialityService, DoctorsSpecialityService>();
            builder.Services.AddTransient<IHospitalService, HospitalService>();
            builder.Services.AddTransient<IMedicalAppointmentService, MedicalAppointmentService>();
            builder.Services.AddTransient<IPatientService, PatientService>();
            builder.Services.AddTransient<IReceptionStatusService, ReceptionStatusService>();
            

            //dal
            builder.Services.AddTransient<IUserRepository, UserRepository>();
            builder.Services.AddTransient<IDoctorRepository, DoctorRepository>();
            builder.Services.AddTransient<IDoctorsSpecialityRepository, DoctorsSpecialityRepository>();
            builder.Services.AddTransient<IHospitalRepository, HospitalRepository>();
            builder.Services.AddTransient<IMedicalAppointmentRepository, MedicalAppointmentRepository>();
            builder.Services.AddTransient<IReceptionStatusRepository, ReceptionStatusRepository>();
            builder.Services.AddTransient<IPatientRepository, PatientRepository>();
           
            
            

            var app = builder.Build();

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseAuthentication();
            app.UseAuthorization();



            app.MapControllers();

            app.Run();
        }
    }
}
