using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IPatientImmunizationRepository
    {
        Task<PatientImmunization> GetPatientImmunizationByIdAsync(int immunizationId);
        Task<List<PatientImmunization>> GetImmunizationsByPatientCardIdAsync(int patientCardId);
        Task<PatientImmunization> AddPatientImmunizationAsync(PatientImmunization immunization);
        Task<PatientImmunization> UpdatePatientImmunizationAsync(PatientImmunization immunization);
        Task DeletePatientImmunizationAsync(int immunizationId);
        Task<bool> PatientImmunizationExistsAsync(int immunizationId);
    }
} 