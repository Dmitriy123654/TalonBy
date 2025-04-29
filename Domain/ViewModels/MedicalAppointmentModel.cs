using Domain.Models;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class MedicalAppointmentModel
    {

        public int HospitalId { get; set; }
        public int PatientId { get; set; }
        public int DoctorId { get; set; }
        public int ReceptionStatusId { get; set; }
        [Required]
        [Column(TypeName = "date")]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan Time { get; set; }
        
        public string FileResultLink { get; set; }
    }

}
