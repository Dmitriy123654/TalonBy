using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IPatientChronicConditionRepository
    {
        Task<PatientChronicCondition> GetPatientChronicConditionByIdAsync(int conditionId);
        Task<List<PatientChronicCondition>> GetChronicConditionsByPatientCardIdAsync(int patientCardId);
        Task<PatientChronicCondition> AddPatientChronicConditionAsync(PatientChronicCondition condition);
        Task<PatientChronicCondition> UpdatePatientChronicConditionAsync(PatientChronicCondition condition);
        Task DeletePatientChronicConditionAsync(int conditionId);
        Task<bool> PatientChronicConditionExistsAsync(int conditionId);
    }
} 