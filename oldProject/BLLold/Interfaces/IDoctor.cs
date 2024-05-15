using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Interfaces
{
    public interface IDoctor
    {
        
            public int DoctorId { get; set; }

            public int HospitalId { get; set; }
            public int DoctorsSpecialityId { get; set; }

            public string FullName { get; set; }

            public byte?[] Photo { get; set; }

            public string WorkingHours { get; set; }

            public string Office { get; set; }

            public string AdditionalInfo { get; set; }

           /* public  IDoctorSpeciality DoctorsSpeciality { get; set; }

            public  IHospital Hospital { get; set; }

            public  ICollection<IMedicalAppointment> MedicalAppointments { get; set; }*/

    }
}
