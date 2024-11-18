using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class MedicalAppointmentRepository : IMedicalAppointmentRepository
    {
        private readonly ApplicationContext _dbContext;

        public MedicalAppointmentRepository(ApplicationContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<MedicalAppointment> CreateAsync(MedicalAppointment appointment)
        {
            _dbContext.MedicalAppointments.Add(appointment);
            await _dbContext.SaveChangesAsync();
            return appointment;
        }

        public async Task UpdateAsync(MedicalAppointment appointment)
        {
            _dbContext.MedicalAppointments.Update(appointment);
            await _dbContext.SaveChangesAsync();
        }

        public async Task DeleteAsync(MedicalAppointment appointment)
        {
            _dbContext.MedicalAppointments.Remove(appointment);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<MedicalAppointment> GetByIdAsync(int id)
        {
            return await _dbContext.MedicalAppointments.FindAsync(id);
        }

        public async Task<IEnumerable<MedicalAppointmentDTO>> GetAllAsync(MedicalAppointmentSearchParameters parameters)
        {
            var query = _dbContext.MedicalAppointments
                .Include(a => a.Hospital)
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Include(a => a.ReceptionStatus)
                .AsQueryable();

            if (parameters.HospitalId.HasValue)
                query = query.Where(a => a.HospitalId == parameters.HospitalId.Value);

            if (parameters.PatientId.HasValue)
                query = query.Where(a => a.PatientId == parameters.PatientId.Value);

            if (parameters.DoctorId.HasValue)
                query = query.Where(a => a.DoctorId == parameters.DoctorId.Value);

            if (parameters.ReceptionStatusId.HasValue)
                query = query.Where(a => a.ReceptionStatusId == parameters.ReceptionStatusId.Value);

            if (parameters.DateFrom.HasValue)
                query = query.Where(a => a.Date >= parameters.DateFrom.Value);

            if (parameters.DateTo.HasValue)
                query = query.Where(a => a.Date <= parameters.DateTo.Value);

            if (parameters.TimeFrom.HasValue)
                query = query.Where(a => a.Time >= parameters.TimeFrom.Value);

            if (parameters.TimeTo.HasValue)
                query = query.Where(a => a.Time <= parameters.TimeTo.Value);

            var result = await query.Select(a => new MedicalAppointmentDTO
            {
                Id = a.MedicalAppointmentId,
                HospitalName = a.Hospital.Name,
                PatientName = a.Patient.Name,
                DoctorName = a.Doctor.FullName,
                DoctorSpecialty = a.Doctor.DoctorsSpeciality.Name,
                ReceptionStatus = a.ReceptionStatus.Status.ToString(),
                Description = a.Description

            }).ToListAsync();

            return result;
        }
    }
}
