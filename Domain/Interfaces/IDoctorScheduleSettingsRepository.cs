using Domain.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IDoctorScheduleSettingsRepository
    {
        Task<DoctorScheduleSettings> GetDoctorScheduleSettingsAsync(int doctorId);
        Task<bool> SaveDoctorScheduleSettingsAsync(DoctorScheduleSettings settings);
        Task<bool> DoctorScheduleSettingsExistsAsync(int doctorId);
        Task<bool> UpdateDoctorScheduleSettingsAsync(DoctorScheduleSettings settings);
    }
} 