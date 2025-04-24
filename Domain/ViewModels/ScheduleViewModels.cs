using System;
using System.Collections.Generic;

namespace Domain.ViewModels
{
    // DTO для настроек расписания
    public class ScheduleSettingsViewModel
    {
        public int DoctorId { get; set; }
        public string WorkdayStart { get; set; } // в формате "HH:MM"
        public string WorkdayEnd { get; set; } // в формате "HH:MM"
        public int SlotDuration { get; set; } // длительность в минутах
        public int BreakDuration { get; set; } // перерыв в минутах
        public List<int> WorkDays { get; set; } // дни недели (0-6)
    }

    // DTO для временного слота
    public class TimeSlotViewModel
    {
        public int Id { get; set; }
        public int DoctorId { get; set; }
        public string Date { get; set; } // в формате "YYYY-MM-DD"
        public string Time { get; set; } // в формате "HH:MM"
        public int Duration { get; set; } // в минутах
        public bool IsAvailable { get; set; }
    }

    // DTO для обновления доступности слота
    public class UpdateSlotViewModel
    {
        public bool IsAvailable { get; set; }
    }

    // DTO для запроса генерации расписания
    public class GenerateScheduleRequestViewModel
    {
        public int DoctorId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public ScheduleSettingsViewModel Settings { get; set; }
    }

    // DTO для представления расписания врача
    public class DoctorScheduleViewModel
    {
        public int DoctorId { get; set; }
        public string DoctorName { get; set; }
        public string Specialization { get; set; }
        public Dictionary<string, List<TimeSlotViewModel>> Schedule { get; set; }
    }
} 