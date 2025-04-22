using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class UserRepository : IUserRepository
    {
        private readonly ApplicationContext _context;


        public UserRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<User> GetByEmail(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        public async Task Create(User user)
        {
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
        }
        public async Task<User> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FindAsync(userId);
        }

        public async Task UpdateUserAsync(User user)
        {
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        public Patient CreatePatient(Patient patient)
        {
            try
            {
                _context.Patients.Add(patient);
                _context.SaveChanges();
                return patient;
            }
            catch (Exception ex)
            {
                // Логирование или обработка ошибки
                throw new Exception("Ошибка при сохранении пациента: " + ex.InnerException?.Message, ex);
            }
        }
        public async Task<Patient> CreatePatientAsync(Patient patient)
        {
            var user = await _context.Users.FindAsync(patient.UserId);
            if (user == null)
            {
                throw new Exception($"Пользователь с идентификатором {patient.UserId} не найден.");
            }

            patient.User = user;
            _context.Patients.Add(patient);
            await _context.SaveChangesAsync();
            return patient;
        }

        // Implement new CRUD operations
        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _context.Users.ToListAsync();
        }

        public async Task DeleteUserAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user != null)
            {
                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<bool> UserExistsAsync(int userId)
        {
            return await _context.Users.AnyAsync(u => u.UserId == userId);
        }

        public async Task<User> UpdateUserProfileAsync(int userId, UpdateUserModel updateModel)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                throw new Exception($"Пользователь с ID {userId} не найден");
            }

            // Update only the properties provided in the model
            if (!string.IsNullOrEmpty(updateModel.Email))
            {
                user.Email = updateModel.Email;
            }
            if (!string.IsNullOrEmpty(updateModel.Phone))
            {
                user.Phone = updateModel.Phone;
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();
            return user;
        }
    }
}
