using Domain.Models;
using Domain.ViewModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IUserRepository
    {
        Task<User> GetByEmail(string email);
        Task Create(User user);

        Task<User> GetUserByIdAsync(int userId);
       
        Task UpdateUserAsync(User user);
        Task<Patient> CreatePatientAsync(Patient patient);
        Task<List<User>> GetAllUsersAsync();
        Task DeleteUserAsync(int userId);
        Task<bool> UserExistsAsync(int userId);
        Task<User> UpdateUserProfileAsync(int userId, UpdateUserModel updateModel);
    }
}
