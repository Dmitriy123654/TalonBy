using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class PatientChronicCondition
    {
        [Key]
        public int ConditionId { get; set; }

        [Required]
        public int PatientCardId { get; set; }

        [Required]
        [StringLength(200)]
        public string ConditionName { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime DiagnosedDate { get; set; }

        [ForeignKey("PatientCardId")]
        public virtual PatientCard PatientCard { get; set; }
    }
} 