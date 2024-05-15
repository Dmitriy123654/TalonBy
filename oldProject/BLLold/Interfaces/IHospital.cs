using SharedLibrary;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;


namespace BLL.Interfaces
{
    public interface IHospital
    {
        public int HospitalId { get; set; }
        public string Name { get; set; }
        public string Address { get; set; }
        public HospitalType Type { get; set; }
        public string WorkingHours { get; set; }

        public string Phones { get; set; }

        public string Enail { get; set; }

        public string Description { get; set; }

        /*public virtual ICollection<Doctor> Doctors { get; set; }
        public virtual ICollection<MedicalAppointment> MedicalAppointments { get; set; }*/
    }
   
}
