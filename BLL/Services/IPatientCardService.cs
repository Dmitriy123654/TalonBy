using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BLL.Services
{
    public interface IPatientCardService
    {
        Task<PatientCard> GetPatientCardByIdAsync(int patientCardId);
        Task<List<PatientCard>> GetAllPatientCardsAsync();
        Task<PatientCard> AddPatientCardAsync(PatientCard patientCard);
        Task<PatientCard> UpdatePatientCardAsync(PatientCard patientCard);
        Task DeletePatientCardAsync(int patientCardId);
        Task<bool> PatientCardExistsAsync(int patientCardId);
        Task<PatientCard> GetPatientCardByPatientIdAsync(int patientId);
        
        // Allergy management
        Task<List<PatientAllergy>> GetAllergiesByPatientCardIdAsync(int patientCardId);
        Task<PatientAllergy> AddAllergyAsync(PatientAllergy allergy);
        Task<PatientAllergy> UpdateAllergyAsync(PatientAllergy allergy);
        Task DeleteAllergyAsync(int allergyId);
        
        // Chronic condition management
        Task<List<PatientChronicCondition>> GetChronicConditionsByPatientCardIdAsync(int patientCardId);
        Task<PatientChronicCondition> AddChronicConditionAsync(PatientChronicCondition condition);
        Task<PatientChronicCondition> UpdateChronicConditionAsync(PatientChronicCondition condition);
        Task DeleteChronicConditionAsync(int conditionId);
        
        // Immunization management
        Task<List<PatientImmunization>> GetImmunizationsByPatientCardIdAsync(int patientCardId);
        Task<PatientImmunization> AddImmunizationAsync(PatientImmunization immunization);
        Task<PatientImmunization> UpdateImmunizationAsync(PatientImmunization immunization);
        Task DeleteImmunizationAsync(int immunizationId);
    }
} 