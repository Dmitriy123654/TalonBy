using System;
using System.ComponentModel.DataAnnotations;

namespace Domain.ViewModels
{
    public class AppointmentMedicalDetailsModel
    {
        public int MedicalAppointmentId { get; set; }
        
        [StringLength(300)]
        public string Diagnosis { get; set; }
        
        [StringLength(3000)]
        public string Treatment { get; set; }
        
        [StringLength(500)]
        public string Prescriptions { get; set; }
        
        [StringLength(3000)]
        public string? LabResults { get; set; }
        
        [StringLength(3000)]
        public string? MedicalHistory { get; set; }
        
        [StringLength(500)]
        public string? Allergies { get; set; }
        
        [StringLength(1000)]
        public string? VitalSigns { get; set; }
        
        public DateTime? NextAppointmentDate { get; set; }
    }
} 