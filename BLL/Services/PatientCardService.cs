using Domain.Interfaces;
using Domain.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BLL.Services
{
    public class PatientCardService : IPatientCardService
    {
        private readonly IPatientCardRepository _patientCardRepository;
        private readonly IPatientAllergyRepository _allergyRepository;
        private readonly IPatientChronicConditionRepository _chronicConditionRepository;
        private readonly IPatientImmunizationRepository _immunizationRepository;

        public PatientCardService(
            IPatientCardRepository patientCardRepository,
            IPatientAllergyRepository allergyRepository,
            IPatientChronicConditionRepository chronicConditionRepository,
            IPatientImmunizationRepository immunizationRepository)
        {
            _patientCardRepository = patientCardRepository;
            _allergyRepository = allergyRepository;
            _chronicConditionRepository = chronicConditionRepository;
            _immunizationRepository = immunizationRepository;
        }

        // PatientCard methods
        public async Task<PatientCard> AddPatientCardAsync(PatientCard patientCard)
        {
            return await _patientCardRepository.AddPatientCardAsync(patientCard);
        }

        public async Task DeletePatientCardAsync(int patientCardId)
        {
            await _patientCardRepository.DeletePatientCardAsync(patientCardId);
        }

        public async Task<List<PatientCard>> GetAllPatientCardsAsync()
        {
            return await _patientCardRepository.GetAllPatientCardsAsync();
        }

        public async Task<PatientCard> GetPatientCardByIdAsync(int patientCardId)
        {
            return await _patientCardRepository.GetPatientCardByIdAsync(patientCardId);
        }

        public async Task<PatientCard> GetPatientCardByPatientIdAsync(int patientId)
        {
            return await _patientCardRepository.GetPatientCardByPatientIdAsync(patientId);
        }

        public async Task<bool> PatientCardExistsAsync(int patientCardId)
        {
            return await _patientCardRepository.PatientCardExistsAsync(patientCardId);
        }

        public async Task<PatientCard> UpdatePatientCardAsync(PatientCard patientCard)
        {
            return await _patientCardRepository.UpdatePatientCardAsync(patientCard);
        }

        // Allergy methods
        public async Task<PatientAllergy> AddAllergyAsync(PatientAllergy allergy)
        {
            return await _allergyRepository.AddPatientAllergyAsync(allergy);
        }

        public async Task DeleteAllergyAsync(int allergyId)
        {
            await _allergyRepository.DeletePatientAllergyAsync(allergyId);
        }

        public async Task<List<PatientAllergy>> GetAllergiesByPatientCardIdAsync(int patientCardId)
        {
            return await _allergyRepository.GetAllergiesByPatientCardIdAsync(patientCardId);
        }

        public async Task<PatientAllergy> UpdateAllergyAsync(PatientAllergy allergy)
        {
            return await _allergyRepository.UpdatePatientAllergyAsync(allergy);
        }

        // Chronic condition methods
        public async Task<PatientChronicCondition> AddChronicConditionAsync(PatientChronicCondition condition)
        {
            return await _chronicConditionRepository.AddPatientChronicConditionAsync(condition);
        }

        public async Task DeleteChronicConditionAsync(int conditionId)
        {
            await _chronicConditionRepository.DeletePatientChronicConditionAsync(conditionId);
        }

        public async Task<List<PatientChronicCondition>> GetChronicConditionsByPatientCardIdAsync(int patientCardId)
        {
            return await _chronicConditionRepository.GetChronicConditionsByPatientCardIdAsync(patientCardId);
        }

        public async Task<PatientChronicCondition> UpdateChronicConditionAsync(PatientChronicCondition condition)
        {
            return await _chronicConditionRepository.UpdatePatientChronicConditionAsync(condition);
        }

        // Immunization methods
        public async Task<PatientImmunization> AddImmunizationAsync(PatientImmunization immunization)
        {
            return await _immunizationRepository.AddPatientImmunizationAsync(immunization);
        }

        public async Task DeleteImmunizationAsync(int immunizationId)
        {
            await _immunizationRepository.DeletePatientImmunizationAsync(immunizationId);
        }

        public async Task<List<PatientImmunization>> GetImmunizationsByPatientCardIdAsync(int patientCardId)
        {
            return await _immunizationRepository.GetImmunizationsByPatientCardIdAsync(patientCardId);
        }

        public async Task<PatientImmunization> UpdateImmunizationAsync(PatientImmunization immunization)
        {
            return await _immunizationRepository.UpdatePatientImmunizationAsync(immunization);
        }
    }
} 