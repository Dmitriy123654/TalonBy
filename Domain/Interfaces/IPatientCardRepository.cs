using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IPatientCardRepository
    {
        Task<PatientCard> GetPatientCardByIdAsync(int patientCardId);
        Task<List<PatientCard>> GetAllPatientCardsAsync();
        Task<PatientCard> AddPatientCardAsync(PatientCard patientCard);
        Task<PatientCard> UpdatePatientCardAsync(PatientCard patientCard);
        Task DeletePatientCardAsync(int patientCardId);
        Task<bool> PatientCardExistsAsync(int patientCardId);
        Task<PatientCard> GetPatientCardByPatientIdAsync(int patientId);
    }
} 