using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class PatientImmunization
    {
        [Key]
        public int ImmunizationId { get; set; }

        [Required]
        public int PatientCardId { get; set; }

        [Required]
        [StringLength(150)]
        public string VaccineName { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime VaccinationDate { get; set; }

        [ForeignKey("PatientCardId")]
        public virtual PatientCard PatientCard { get; set; }
    }
} 