using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class TimeSlot
    {
        [Key]
        public int TimeSlotId { get; set; }

        [Required]
        public int DoctorId { get; set; }

        [Required]
        [Column(TypeName = "date")]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan Time { get; set; }

        [Required]
        public int Duration { get; set; } // Длительность в минутах

        [Required]
        public bool IsAvailable { get; set; } = true;

        [ForeignKey("DoctorId")]
        public virtual Doctor Doctor { get; set; }
    }
} 