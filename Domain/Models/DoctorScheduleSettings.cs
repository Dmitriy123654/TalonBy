using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Domain.Models
{
    public class DoctorScheduleSettings
    {
        [Key]
        public int DoctorScheduleSettingsId { get; set; }

        [Required]
        public int DoctorId { get; set; }

        [Required]
        public TimeSpan WorkdayStart { get; set; } // Время начала рабочего дня

        [Required]
        public TimeSpan WorkdayEnd { get; set; } // Время окончания рабочего дня

        [Required]
        public int SlotDuration { get; set; } // Длительность приема в минутах

        [Required]
        public int BreakDuration { get; set; } // Длительность перерыва между приемами в минутах

        // Рабочие дни (0 - воскресенье, 1 - понедельник, и т.д.)
        [Required]
        public string WorkDays { get; set; } = "1,2,3,4,5"; // По умолчанию Пн-Пт

        [ForeignKey("DoctorId")]
        public virtual Doctor Doctor { get; set; }
    }
} 