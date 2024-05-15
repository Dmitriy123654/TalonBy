using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Numerics;



namespace Domain.Models
{
    public class MedicalAppointment 
    {
        [Key]
        public int MedicalAppointmentId { get; set; }

        public int HospitalId { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public int ReceptionStatusId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan Time { get; set; }

        public string TextResult { get; set; }

        [StringLength(500)]
        public string Description { get; set; }

        [ForeignKey("HospitalId")]
        public virtual Hospital Hospital { get; set; }

        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }

        [ForeignKey("DoctorId")]
        public virtual Doctor Doctor { get; set; }

        [ForeignKey("ReceptionStatusId")]
        public virtual ReceptionStatus ReceptionStatus { get; set; }
    }
}
