using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace Domain.Models
{
    public class User 
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public RoleOfUser Role { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsPhoneVerified { get; set; }

        // Коллекция пациентов для отношения "один ко многим"
        public virtual ICollection<Patient> Patients { get; set; }
    }
}
