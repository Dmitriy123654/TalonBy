using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class AppointmentMedicalDetailsRepository : IAppointmentMedicalDetailsRepository
    {
        private readonly ApplicationContext _context;

        public AppointmentMedicalDetailsRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<AppointmentMedicalDetails> GetByIdAsync(int id)
        {
            return await _context.AppointmentMedicalDetails
                .FirstOrDefaultAsync(d => d.AppointmentMedicalDetailsId == id);
        }

        public async Task<AppointmentMedicalDetails> GetByAppointmentIdAsync(int appointmentId)
        {
            return await _context.AppointmentMedicalDetails
                .FirstOrDefaultAsync(d => d.MedicalAppointmentId == appointmentId);
        }

        public async Task<IEnumerable<AppointmentMedicalDetails>> GetAllAsync()
        {
            return await _context.AppointmentMedicalDetails.ToListAsync();
        }

        public async Task<AppointmentMedicalDetails> AddAsync(AppointmentMedicalDetails details)
        {
            var result = await _context.AppointmentMedicalDetails.AddAsync(details);
            await _context.SaveChangesAsync();
            return result.Entity;
        }

        public async Task<AppointmentMedicalDetails> UpdateAsync(AppointmentMedicalDetails details)
        {
            var existingDetails = await _context.AppointmentMedicalDetails
                .FirstOrDefaultAsync(d => d.AppointmentMedicalDetailsId == details.AppointmentMedicalDetailsId);

            if (existingDetails == null)
                return null;

            _context.Entry(existingDetails).CurrentValues.SetValues(details);
            await _context.SaveChangesAsync();
            return existingDetails;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var details = await _context.AppointmentMedicalDetails
                .FirstOrDefaultAsync(d => d.AppointmentMedicalDetailsId == id);

            if (details == null)
                return false;

            _context.AppointmentMedicalDetails.Remove(details);
            await _context.SaveChangesAsync();
            return true;
        }
    }
} 