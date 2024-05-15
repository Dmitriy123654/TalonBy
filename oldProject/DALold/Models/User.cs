

using System.ComponentModel.DataAnnotations.Schema;

namespace DAL.Models
{
    public class User : IUser
    {
        public int UserId { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        //public UserType Type { get; set; }
        public int? PatientId { get; set; }

        [ForeignKey("PatientId")]
        public virtual Patient Patient { get; set; }
    }

  
    

}
