
using System.ComponentModel.DataAnnotations;

namespace DAL.Models
{
    public class DoctorsSpeciality : IDoctorSpeciality
    {
        [Key]
        public int DoctorsSpecialityId { get; set; }

        [Required]
        [StringLength(200)]
        public string Name { get; set; }

        public virtual ICollection<Doctor> Doctors { get; set; }
    }
}
