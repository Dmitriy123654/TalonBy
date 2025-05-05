using Domain.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface ITimeSlotRepository
    {
        Task<TimeSlot> GetTimeSlotByIdAsync(int slotId);
        Task<TimeSlot> GetTimeSlotAsync(int doctorId, DateTime date, TimeSpan time);
        Task<List<TimeSlot>> GetTimeSlotsForDateAsync(int doctorId, DateTime date);
        Task<List<TimeSlot>> GetDoctorTimeSlotsAsync(int doctorId, DateTime startDate, DateTime endDate);
        Task<bool> TimeSlotExistsAsync(int doctorId, DateTime date, TimeSpan startTime);
        Task<bool> CreateTimeSlotAsync(TimeSlot timeSlot);
        Task<bool> UpdateTimeSlotAsync(TimeSlot timeSlot);
        Task<bool> DeleteTimeSlotAsync(int slotId);
        Task<bool> DeleteTimeSlotsForPeriodAsync(int doctorId, DateTime startDate, DateTime endDate);
        Task<Doctor> GetDoctorByIdAsync(int doctorId);
        
        // Новые методы
        Task<bool> DeleteDoctorTimeSlotsAsync(int doctorId, DateTime startDate, DateTime endDate);
        Task<bool> SaveRangeAsync(List<TimeSlot> timeSlots);
    }
} 