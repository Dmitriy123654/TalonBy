

using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class User 
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public RoleOfUser Role { get; set; }
        public int? PatientId { get; set; }

        /*[ForeignKey("PatientId")]*/
        public virtual Patient Patient { get; set; }
    }
}
