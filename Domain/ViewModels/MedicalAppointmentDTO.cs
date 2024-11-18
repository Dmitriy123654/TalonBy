using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class MedicalAppointmentDTO
    {
        public int Id { get; set; }
        public string HospitalName { get; set; }
        public string PatientName { get; set; }
        public string DoctorName { get; set; }
        public string DoctorSpecialty { get; set; }
        public string ReceptionStatus { get; set; }
        public string Description { get; set;}
    }
}
