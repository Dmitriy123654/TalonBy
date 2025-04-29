using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IAppointmentMedicalDetailsRepository
    {
        Task<AppointmentMedicalDetails> GetByIdAsync(int id);
        Task<AppointmentMedicalDetails> GetByAppointmentIdAsync(int appointmentId);
        Task<IEnumerable<AppointmentMedicalDetails>> GetAllAsync();
        Task<AppointmentMedicalDetails> AddAsync(AppointmentMedicalDetails details);
        Task<AppointmentMedicalDetails> UpdateAsync(AppointmentMedicalDetails details);
        Task<bool> DeleteAsync(int id);
    }
} 