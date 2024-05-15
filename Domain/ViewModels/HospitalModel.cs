using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class HospitalModel
    {
        public string Name { get; set; }
        public string Address { get; set; }
        public HospitalType Type { get; set; }
        public string WorkingHours { get; set; }
        public string Phones { get; set; }
        public string Enail { get; set; }
        public string Description { get; set; }
    }
}
