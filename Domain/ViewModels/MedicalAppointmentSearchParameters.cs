using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class MedicalAppointmentSearchParameters
    {
        public int? HospitalId { get; set; }
        public int? PatientId { get; set; }
        public int? DoctorId { get; set; }
        public int? ReceptionStatusId { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public TimeSpan? TimeFrom { get; set; }
        public TimeSpan? TimeTo { get; set; }
    }
}
