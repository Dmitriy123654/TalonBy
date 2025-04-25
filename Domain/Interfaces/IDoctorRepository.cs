using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IDoctorRepository
    {
        Task<List<Doctor>> GetAllAsync();
        Task<Doctor> GetByIdAsync(int id);
        Task AddAsync(Doctor doctor);
        Task UpdateAsync(Doctor doctor);
        Task DeleteAsync(int id);
        IEnumerable<Doctor> GetByHospitalId(int hospitalId);
        IEnumerable<Doctor> GetBySpecialtyAndHospitalId(int hospitalId, int specialtyId);
        Task<IEnumerable<Doctor>> GetBySpecialityAsync(int specialityId);
        Task<IEnumerable<Doctor>> GetDoctorsBySpecialityIdAsync(int specialityId);
        Task<Doctor> GetByUserIdAsync(int userId);
    }
}
