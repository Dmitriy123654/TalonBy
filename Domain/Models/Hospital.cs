

using System.ComponentModel.DataAnnotations;

namespace Domain.Models
{
    public class Hospital 
    {
        [Key]
        public int HospitalId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        [Required]
        [StringLength(500)]
        public string Address { get; set; }

        [Required]
        [StringLength(100)]
        public HospitalType Type { get; set; }

        [Required]
        public string WorkingHours { get; set; }

        [Required]
        [StringLength(100)]
        public string Phones { get; set; }

        [StringLength(100)]
        public string Enail { get; set; }

        [StringLength(1000)]
        public string Description { get; set; }

        public virtual ICollection<Doctor> Doctors { get; set; }
        public virtual ICollection<MedicalAppointment> MedicalAppointments { get; set; }
    }

   

}
