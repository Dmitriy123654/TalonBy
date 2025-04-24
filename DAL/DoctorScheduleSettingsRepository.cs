using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class DoctorScheduleSettingsRepository : IDoctorScheduleSettingsRepository
    {
        private readonly ApplicationContext _context;

        public DoctorScheduleSettingsRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<DoctorScheduleSettings> GetDoctorScheduleSettingsAsync(int doctorId)
        {
            return await _context.DoctorScheduleSettings
                .FirstOrDefaultAsync(s => s.DoctorId == doctorId);
        }

        public async Task<bool> SaveDoctorScheduleSettingsAsync(DoctorScheduleSettings settings)
        {
            try
            {
                await _context.DoctorScheduleSettings.AddAsync(settings);
                return await _context.SaveChangesAsync() > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> DoctorScheduleSettingsExistsAsync(int doctorId)
        {
            return await _context.DoctorScheduleSettings
                .AnyAsync(s => s.DoctorId == doctorId);
        }

        public async Task<bool> UpdateDoctorScheduleSettingsAsync(DoctorScheduleSettings settings)
        {
            try
            {
                _context.DoctorScheduleSettings.Update(settings);
                return await _context.SaveChangesAsync() > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }
    }
} 