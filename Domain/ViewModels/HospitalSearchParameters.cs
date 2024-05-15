using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.ViewModels
{
    public class HospitalSearchParameters
    {
        public IEnumerable<HospitalType>? HospitalTypes { get; set; }
        public string? Name { get; set; }
    }
}
