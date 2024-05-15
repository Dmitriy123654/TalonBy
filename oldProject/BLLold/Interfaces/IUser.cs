using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Interfaces
{
    public interface IUser
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        //public UserType Type { get; set; }
        public int? PatientId { get; set; }

        /*[ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }*/
    }
}
