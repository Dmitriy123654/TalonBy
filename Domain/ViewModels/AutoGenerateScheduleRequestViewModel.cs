using System;

namespace Domain.ViewModels
{
    /// <summary>
    /// Модель запроса для автоматической генерации расписания
    /// </summary>
    public class AutoGenerateScheduleRequestViewModel
    {
        /// <summary>
        /// Область применения (allHospitals, selectedHospital, selectedSpeciality, selectedDoctor)
        /// </summary>
        public string Scope { get; set; }

        /// <summary>
        /// Дата начала генерации
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Дата окончания генерации
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Настройки расписания
        /// </summary>
        public ScheduleSettingsViewModel Settings { get; set; }

        /// <summary>
        /// ID больницы (если выбрана больница или специальность)
        /// </summary>
        public int? HospitalId { get; set; }

        /// <summary>
        /// ID специальности (если выбрана специальность)
        /// </summary>
        public int? SpecialityId { get; set; }

        /// <summary>
        /// ID врача (если выбран врач)
        /// </summary>
        public int? DoctorId { get; set; }

        /// <summary>
        /// Флаг для очистки существующего расписания перед генерацией
        /// </summary>
        public bool ClearExistingSchedule { get; set; } = false;
    }
} 