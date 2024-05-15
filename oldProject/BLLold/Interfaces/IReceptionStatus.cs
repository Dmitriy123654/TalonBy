using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Interfaces
{
    public interface IReceptionStatus
    {
        public int ReceptionStatusId { get; set; }

        public string Status { get; set; }

       /* public virtual ICollection<MedicalAppointment> MedicalAppointments { get; set; }*/
    }
}
