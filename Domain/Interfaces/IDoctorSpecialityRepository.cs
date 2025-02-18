using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IDoctorsSpecialityRepository
    {
        Task<List<DoctorsSpeciality>> GetAllAsync();
        Task<DoctorsSpeciality> GetByIdAsync(int id);
        Task AddAsync(DoctorsSpeciality speciality);
        Task UpdateAsync(DoctorsSpeciality speciality);
        Task DeleteAsync(int id);
        IEnumerable<DoctorsSpeciality> GetByHospitalId(int hospitalId);
    }
}