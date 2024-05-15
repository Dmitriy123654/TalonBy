
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Domain.Models
{
    public class Patient 
    {
        public int PatientId { get; set; }
        public string Name { get; set; }
        /*        public string FirstName { get; set; }
                public string MiddleName { get; set; }*/
        public Gender Gender { get; set; }
        public DateTime DateOfBirth { get; set; }
        //public byte[] Photo { get; set; }
        //public string Email { get; set; }
        //public string City { get; set; }
        public string Address { get; set; }
        public int? UserId { get; set; }

        [JsonIgnore]
        public virtual User User { get; set; }
        /*  public int TerritorialClinicId { get; set; }
          public TerritorialClinic TerritorialClinic { get; set; }*/
    }

   
}
