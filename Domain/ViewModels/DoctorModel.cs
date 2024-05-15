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
    public class DoctorModel
    {
        public int HospitalId { get; set; }
        public int DoctorsSpecialityId { get; set; }
        public string FullName { get; set; }
        public string? Photo { get; set; }
        public string WorkingHours { get; set; }
        public string Office { get; set; }
        public string AdditionalInfo { get; set; }
    }
}
