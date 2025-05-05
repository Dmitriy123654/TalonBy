using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class PatientAllergy
    {
        [Key]
        public int AllergyId { get; set; }

        [Required]
        public int PatientCardId { get; set; }

        [Required]
        [StringLength(100)]
        public string AllergyName { get; set; }

        [Required]
        public AllergySeverity Severity { get; set; }

        [ForeignKey("PatientCardId")]
        public virtual PatientCard PatientCard { get; set; }
    }
} 