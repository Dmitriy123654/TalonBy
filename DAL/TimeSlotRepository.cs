using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class TimeSlotRepository : ITimeSlotRepository
    {
        private readonly ApplicationContext _context;

        public TimeSlotRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<TimeSlot> GetTimeSlotByIdAsync(int slotId)
        {
            return await _context.TimeSlots
                .FirstOrDefaultAsync(s => s.TimeSlotId == slotId);
        }

        public async Task<TimeSlot> GetTimeSlotAsync(int doctorId, DateTime date, TimeSpan time)
        {
            return await _context.TimeSlots
                .Where(s => s.DoctorId == doctorId && s.Date.Date == date.Date && s.Time == time)
                .FirstOrDefaultAsync();
        }

        public async Task<List<TimeSlot>> GetTimeSlotsForDateAsync(int doctorId, DateTime date)
        {
            return await _context.TimeSlots
                .Where(s => s.DoctorId == doctorId && s.Date.Date == date.Date)
                .OrderBy(s => s.Time)
                .ToListAsync();
        }

        public async Task<List<TimeSlot>> GetDoctorTimeSlotsAsync(int doctorId, DateTime startDate, DateTime endDate)
        {
            return await _context.TimeSlots
                .Where(s => s.DoctorId == doctorId && s.Date >= startDate.Date && s.Date <= endDate.Date)
                .OrderBy(s => s.Date)
                .ThenBy(s => s.Time)
                .ToListAsync();
        }

        public async Task<bool> TimeSlotExistsAsync(int doctorId, DateTime date, TimeSpan startTime)
        {
            return await _context.TimeSlots
                .AnyAsync(s => s.DoctorId == doctorId && s.Date.Date == date.Date && s.Time == startTime);
        }

        public async Task<bool> CreateTimeSlotAsync(TimeSlot timeSlot)
        {
            try
            {
                _context.TimeSlots.Add(timeSlot);
                return await _context.SaveChangesAsync() > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> UpdateTimeSlotAsync(TimeSlot timeSlot)
        {
            try
            {
                _context.TimeSlots.Update(timeSlot);
                return await _context.SaveChangesAsync() > 0;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> DeleteTimeSlotAsync(int slotId)
        {
            try
            {
                var slot = await _context.TimeSlots.FindAsync(slotId);
                if (slot != null)
                {
                    _context.TimeSlots.Remove(slot);
                    return await _context.SaveChangesAsync() > 0;
                }
                return false;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<bool> DeleteTimeSlotsForPeriodAsync(int doctorId, DateTime startDate, DateTime endDate)
        {
            try
            {
                var slots = await _context.TimeSlots
                    .Where(s => s.DoctorId == doctorId && s.Date >= startDate.Date && s.Date <= endDate.Date)
                    .ToListAsync();

                if (slots.Any())
                {
                    _context.TimeSlots.RemoveRange(slots);
                    return await _context.SaveChangesAsync() > 0;
                }
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task<Doctor> GetDoctorByIdAsync(int doctorId)
        {
            return await _context.Doctors.FindAsync(doctorId);
        }
    }
} 