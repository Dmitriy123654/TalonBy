using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;



namespace DAL.Models
{
    public class Doctor : IDoctor
    {
        [Key]
        public int DoctorId { get; set; }

        public int HospitalId { get; set; }
        public int DoctorsSpecialityId { get; set; }

        [Required]
        [StringLength(200)]
        public string FullName { get; set; }

        public byte?[] Photo { get; set; }

        [Required]
        public string WorkingHours { get; set; }

        [StringLength(50)]
        public string Office { get; set; }

        [StringLength(1000)]
        public string AdditionalInfo { get; set; }



        [ForeignKey("DoctorsSpecialityId")]
        public virtual DoctorsSpeciality DoctorsSpeciality { get; set; }

        [ForeignKey("HospitalId")]
        public virtual Hospital Hospital { get; set; }

        public virtual ICollection<MedicalAppointment> MedicalAppointments { get; set; }
    }

}
