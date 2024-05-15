using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Interfaces
{
    public interface IMedicalAppointment
    {
        public int MedicalAppointmentId { get; set; }

        public int HospitalId { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public int ReceptionStatusId { get; set; }

        public DateTime Date { get; set; }

        public TimeSpan Time { get; set; }

        public string TextResult { get; set; }

        public string Description { get; set; }

       /* public virtual Hospital Hospital { get; set; }

        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }

        [ForeignKey("DoctorId")]
        public virtual Doctor Doctor { get; set; }

        [ForeignKey("ReceptionStatusId")]
        public virtual ReceptionStatus ReceptionStatus { get; set; }*/
    }
}
