
using System.ComponentModel.DataAnnotations;

namespace DAL.Models
{
    public class ReceptionStatus : IReceptionStatus
    {
        [Key]
        public int ReceptionStatusId { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; }

        public virtual ICollection<MedicalAppointment> MedicalAppointments { get; set; }
    }
   
}
