using Domain.Models;
using Domain.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IMedicalAppointmentRepository
    {
        Task<MedicalAppointment> CreateAsync(MedicalAppointment appointment);
        Task UpdateAsync(MedicalAppointment appointment);
        Task DeleteAsync(MedicalAppointment appointment);
        Task<MedicalAppointment> GetByIdAsync(int id);
        Task<IEnumerable<MedicalAppointment>> GetAllAsync(MedicalAppointmentSearchParameters parameters);
    }
}
