using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IPatientAllergyRepository
    {
        Task<PatientAllergy> GetPatientAllergyByIdAsync(int allergyId);
        Task<List<PatientAllergy>> GetAllergiesByPatientCardIdAsync(int patientCardId);
        Task<PatientAllergy> AddPatientAllergyAsync(PatientAllergy allergy);
        Task<PatientAllergy> UpdatePatientAllergyAsync(PatientAllergy allergy);
        Task DeletePatientAllergyAsync(int allergyId);
        Task<bool> PatientAllergyExistsAsync(int allergyId);
    }
} 