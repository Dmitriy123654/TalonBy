using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class AutoGenerationSettingsRepository : IAutoGenerationSettingsRepository
    {
        private readonly ApplicationContext _context;

        public AutoGenerationSettingsRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AutoGenerationSettings>> GetAllActiveAsync()
        {
            return await _context.AutoGenerationSettings
                .Where(s => s.IsEnabled)
                .ToListAsync();
        }

        public async Task<AutoGenerationSettings> GetByIdAsync(int id)
        {
            return await _context.AutoGenerationSettings
                .FirstOrDefaultAsync(s => s.AutoGenerationSettingsId == id);
        }

        public async Task<AutoGenerationSettings> GetByDoctorIdAsync(int doctorId)
        {
            return await _context.AutoGenerationSettings
                .Where(s => s.IsEnabled && s.Scope == "selectedDoctor" && s.DoctorId == doctorId)
                .FirstOrDefaultAsync();
        }

        public async Task<AutoGenerationSettings> CreateAsync(AutoGenerationSettings settings)
        {
            // Если для этого объекта (врача/больницы/специальности) уже есть настройки, 
            // мы их деактивируем перед созданием новых
            var existingSettings = await GetExistingSettingsAsync(settings);
            
            if (existingSettings != null)
            {
                existingSettings.IsEnabled = false;
                existingSettings.LastUpdatedDate = DateTime.UtcNow;
                _context.AutoGenerationSettings.Update(existingSettings);
            }

            // Установим дату создания
            settings.CreatedDate = DateTime.UtcNow;
            
            await _context.AutoGenerationSettings.AddAsync(settings);
            await _context.SaveChangesAsync();
            
            return settings;
        }

        public async Task<AutoGenerationSettings> UpdateAsync(AutoGenerationSettings settings)
        {
            // Если изменились ключевые параметры, проверяем не существуют ли уже настройки для новых параметров
            var existingSettings = await GetExistingSettingsAsync(settings);
            
            if (existingSettings != null && existingSettings.AutoGenerationSettingsId != settings.AutoGenerationSettingsId)
            {
                existingSettings.IsEnabled = false;
                existingSettings.LastUpdatedDate = DateTime.UtcNow;
                _context.AutoGenerationSettings.Update(existingSettings);
            }

            // Обновляем дату изменения
            settings.LastUpdatedDate = DateTime.UtcNow;
            
            _context.AutoGenerationSettings.Update(settings);
            await _context.SaveChangesAsync();
            
            return settings;
        }

        public async Task<IEnumerable<AutoGenerationSettings>> GetDueForGenerationAsync(DateTime currentDate)
        {
            return await _context.AutoGenerationSettings
                .Where(s => s.IsEnabled && s.NextGenerationDate <= currentDate)
                .ToListAsync();
        }

        public async Task<bool> UpdateNextGenerationDateAsync(int id, DateTime nextGenerationDate)
        {
            var settings = await GetByIdAsync(id);
            
            if (settings == null)
            {
                return false;
            }

            settings.NextGenerationDate = nextGenerationDate;
            settings.LastUpdatedDate = DateTime.UtcNow;
            
            _context.AutoGenerationSettings.Update(settings);
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var settings = await GetByIdAsync(id);
            
            if (settings == null)
            {
                return false;
            }

            _context.AutoGenerationSettings.Remove(settings);
            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> DisableAsync(int id)
        {
            var settings = await GetByIdAsync(id);
            
            if (settings == null)
            {
                return false;
            }

            settings.IsEnabled = false;
            settings.LastUpdatedDate = DateTime.UtcNow;
            
            _context.AutoGenerationSettings.Update(settings);
            await _context.SaveChangesAsync();
            
            return true;
        }

        private async Task<AutoGenerationSettings> GetExistingSettingsAsync(AutoGenerationSettings settings)
        {
            // Находим существующие настройки в зависимости от области применения
            switch (settings.Scope.ToLower())
            {
                case "alldoctors":
                case "allhospitals":
                    // Для всех докторов или всех больниц ищем просто по области
                    return await _context.AutoGenerationSettings
                        .Where(s => s.IsEnabled && s.Scope.ToLower() == settings.Scope.ToLower())
                        .FirstOrDefaultAsync();

                case "selectedhospital":
                    // Для конкретной больницы
                    return await _context.AutoGenerationSettings
                        .Where(s => s.IsEnabled && 
                                s.Scope.ToLower() == "selectedhospital" && 
                                s.HospitalId == settings.HospitalId)
                        .FirstOrDefaultAsync();

                case "selectedspeciality":
                    // Для конкретной специальности в конкретной больнице
                    return await _context.AutoGenerationSettings
                        .Where(s => s.IsEnabled && 
                                s.Scope.ToLower() == "selectedspeciality" && 
                                s.HospitalId == settings.HospitalId && 
                                s.SpecialityId == settings.SpecialityId)
                        .FirstOrDefaultAsync();

                case "selecteddoctor":
                    // Для конкретного врача
                    return await _context.AutoGenerationSettings
                        .Where(s => s.IsEnabled && 
                                s.Scope.ToLower() == "selecteddoctor" && 
                                s.DoctorId == settings.DoctorId)
                        .FirstOrDefaultAsync();

                default:
                    return null;
            }
        }
    }
} 