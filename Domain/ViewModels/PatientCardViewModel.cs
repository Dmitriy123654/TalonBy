using Domain.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class PatientCardViewModel
    {
        public int PatientCardId { get; set; }

        public string BloodType { get; set; }

        public DateTime LastUpdate { get; set; }

        [Required(ErrorMessage = "Patient is required")]
        public int PatientId { get; set; }
        
        // Дополнительные поля для отображения информации о пациенте
        public string PatientName { get; set; }
        public DateTime? PatientDateOfBirth { get; set; }
        public string PatientGender { get; set; }

        public List<PatientAllergyViewModel> Allergies { get; set; } = new List<PatientAllergyViewModel>();
        public List<PatientChronicConditionViewModel> ChronicConditions { get; set; } = new List<PatientChronicConditionViewModel>();
        public List<PatientImmunizationViewModel> Immunizations { get; set; } = new List<PatientImmunizationViewModel>();
    }

    public class PatientAllergyViewModel
    {
        public int AllergyId { get; set; }
        
        public int PatientCardId { get; set; }

        [Required(ErrorMessage = "Allergy name is required")]
        [StringLength(100, ErrorMessage = "Allergy name cannot be longer than 100 characters")]
        public string AllergyName { get; set; }

        [Required(ErrorMessage = "Severity is required")]
        public string Severity { get; set; }
    }

    public class PatientChronicConditionViewModel
    {
        public int ConditionId { get; set; }
        
        public int PatientCardId { get; set; }

        [Required(ErrorMessage = "Condition name is required")]
        [StringLength(200, ErrorMessage = "Condition name cannot be longer than 200 characters")]
        public string ConditionName { get; set; }

        [Required(ErrorMessage = "Diagnosed date is required")]
        public DateTime DiagnosedDate { get; set; }
    }

    public class PatientImmunizationViewModel
    {
        public int ImmunizationId { get; set; }
        
        public int PatientCardId { get; set; }

        [Required(ErrorMessage = "Vaccine name is required")]
        [StringLength(150, ErrorMessage = "Vaccine name cannot be longer than 150 characters")]
        public string VaccineName { get; set; }

        [Required(ErrorMessage = "Vaccination date is required")]
        public DateTime VaccinationDate { get; set; }
    }
} 