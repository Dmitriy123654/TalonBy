using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Interfaces
{
    public interface IDoctorSpeciality
    {
        public int DoctorsSpecialityId { get; set; }
        public string Name { get; set; }
       // public virtual ICollection<Doctor> Doctors { get; set; }
    }
}
