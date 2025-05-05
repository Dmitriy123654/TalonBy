using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class PatientCard
    {
        [Key]
        public int PatientCardId { get; set; }

        public BloodType? BloodType { get; set; }

        public DateTime LastUpdate { get; set; } = DateTime.Now;

        // Reference to existing Patient
        [Required]
        public int PatientId { get; set; }

        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }

        // Navigation properties
        public virtual ICollection<PatientAllergy> Allergies { get; set; }
        public virtual ICollection<PatientChronicCondition> ChronicConditions { get; set; }
        public virtual ICollection<PatientImmunization> Immunizations { get; set; }
        public virtual ICollection<MedicalAppointment> MedicalAppointments { get; set; }
    }
} 