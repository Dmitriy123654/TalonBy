using System;

namespace Domain.Models
{
    /// <summary>
    /// Модель настроек автоматической генерации расписания
    /// </summary>
    public class AutoGenerationSettings
    {
        /// <summary>
        /// Идентификатор настройки
        /// </summary>
        public int AutoGenerationSettingsId { get; set; }

        /// <summary>
        /// Включена ли автоматическая генерация
        /// </summary>
        public bool IsEnabled { get; set; }

        /// <summary>
        /// Область применения (AllHospitals, SelectedHospital, SelectedSpeciality, SelectedDoctor)
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
        /// ID пользователя, создавшего настройку
        /// </summary>
        public int CreatedByUserId { get; set; }

        /// <summary>
        /// Дата создания
        /// </summary>
        public DateTime CreatedDate { get; set; }

        /// <summary>
        /// Дата последнего обновления
        /// </summary>
        public DateTime? LastUpdatedDate { get; set; }

        /// <summary>
        /// Настройки расписания в формате JSON
        /// </summary>
        public string ScheduleSettingsJson { get; set; }
    }
} 