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
        Task<IEnumerable<MedicalAppointmentDTO>> GetAllAsync(MedicalAppointmentSearchParameters parameters);
        Task<IEnumerable<MedicalAppointment>> GetByPatientIdAsync(int patientId);
        Task<IEnumerable<MedicalAppointment>> GetByPatientCardIdAsync(int patientCardId);
        Task UpdatePatientCardAsync(int appointmentId, int patientCardId);
        Task UpdateStatusAsync(int appointmentId, int receptionStatusId, string fileResultLink);
    }
}
