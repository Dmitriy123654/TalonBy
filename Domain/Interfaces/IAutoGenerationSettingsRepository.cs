using Domain.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    /// <summary>
    /// Интерфейс репозитория для работы с настройками автоматической генерации
    /// </summary>
    public interface IAutoGenerationSettingsRepository
    {
        /// <summary>
        /// Получить все активные настройки автогенерации
        /// </summary>
        /// <returns>Список активных настроек</returns>
        Task<IEnumerable<AutoGenerationSettings>> GetAllActiveAsync();

        /// <summary>
        /// Получить настройки по ID
        /// </summary>
        /// <param name="id">ID настроек</param>
        /// <returns>Настройки автогенерации</returns>
        Task<AutoGenerationSettings> GetByIdAsync(int id);

        /// <summary>
        /// Получить настройки для конкретного врача
        /// </summary>
        /// <param name="doctorId">ID врача</param>
        /// <returns>Настройки автогенерации для врача</returns>
        Task<AutoGenerationSettings> GetByDoctorIdAsync(int doctorId);

        /// <summary>
        /// Создать новые настройки автогенерации
        /// </summary>
        /// <param name="settings">Объект настроек</param>
        /// <returns>Созданный объект с ID</returns>
        Task<AutoGenerationSettings> CreateAsync(AutoGenerationSettings settings);

        /// <summary>
        /// Обновить настройки автогенерации
        /// </summary>
        /// <param name="settings">Объект настроек</param>
        /// <returns>Обновленный объект</returns>
        Task<AutoGenerationSettings> UpdateAsync(AutoGenerationSettings settings);

        /// <summary>
        /// Получить настройки, которые нужно применить сейчас
        /// </summary>
        /// <param name="currentDate">Текущая дата</param>
        /// <returns>Список настроек для применения</returns>
        Task<IEnumerable<AutoGenerationSettings>> GetDueForGenerationAsync(DateTime currentDate);

        /// <summary>
        /// Обновить дату следующей генерации
        /// </summary>
        /// <param name="id">ID настроек</param>
        /// <param name="nextGenerationDate">Новая дата следующей генерации</param>
        /// <returns>Результат операции</returns>
        Task<bool> UpdateNextGenerationDateAsync(int id, DateTime nextGenerationDate);

        /// <summary>
        /// Удалить настройки автогенерации
        /// </summary>
        /// <param name="id">ID настроек</param>
        /// <returns>Результат операции</returns>
        Task<bool> DeleteAsync(int id);

        /// <summary>
        /// Отключить автогенерацию
        /// </summary>
        /// <param name="id">ID настроек</param>
        /// <returns>Результат операции</returns>
        Task<bool> DisableAsync(int id);
    }
} 