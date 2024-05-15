
using System.ComponentModel.DataAnnotations;

namespace Domain.Models
{
    public class ReceptionStatus 
    {
        [Key]
        public int ReceptionStatusId { get; set; }

        [Required]
        [Range(0, 2)]
        public Domain.Status  Status { get; set; }

        public virtual ICollection<MedicalAppointment> MedicalAppointments { get; set; }
    }
   
}
