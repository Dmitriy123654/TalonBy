using Domain.Models;
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
    }
}
