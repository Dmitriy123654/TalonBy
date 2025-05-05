using System;

namespace Domain.ViewModels
{
    /// <summary>
    /// ViewModel для настроек автоматической генерации
    /// </summary>
    public class AutoGenerationSettingsViewModel
    {
        /// <summary>
        /// Идентификатор настройки
        /// </summary>
        public int? AutoGenerationSettingsId { get; set; }

        /// <summary>
        /// Включена ли автоматическая генерация
        /// </summary>
        public bool IsEnabled { get; set; }

        /// <summary>
        /// Область применения (allHospitals, selectedHospital, selectedSpeciality, selectedDoctor)
        /// </summary>
        public string Scope { get; set; }

        /// <summary>
        /// Тип периода (week, month, year)
        /// </summary>
        public string PeriodType { get; set; }

        /// <summary>
        /// Дата следующей генерации
        /// </summary>
        public DateTime NextGenerationDate { get; set; }

        /// <summary>
        /// ID больницы (если применимо)
        /// </summary>
        public int? HospitalId { get; set; }

        /// <summary>
        /// ID специальности (если применимо)
        /// </summary>
        public int? SpecialityId { get; set; }

        /// <summary>
        /// ID врача (если применимо)
        /// </summary>
        public int? DoctorId { get; set; }

        /// <summary>
        /// Настройки расписания
        /// </summary>
        public ScheduleSettingsViewModel ScheduleSettings { get; set; }
    }
} 