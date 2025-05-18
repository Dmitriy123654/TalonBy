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
            return await _dbContext.MedicalAppointments
                .Include(a => a.Hospital)
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Include(a => a.ReceptionStatus)
                .Include(a => a.PatientCard)
                .FirstOrDefaultAsync(a => a.MedicalAppointmentId == id);
        }

        public async Task<IEnumerable<MedicalAppointmentDTO>> GetAllAsync(MedicalAppointmentSearchParameters parameters)
        {
            var query = _dbContext.MedicalAppointments
                .Include(a => a.Hospital)
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Include(a => a.ReceptionStatus)
                .Include(a => a.PatientCard)
                .AsQueryable();

            if (parameters.AppointmentId.HasValue)
                query = query.Where(a => a.MedicalAppointmentId == parameters.AppointmentId.Value);

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
                Date = a.Date,
                Time = a.Time,
                PatientCardId = a.PatientCardId,
                PatientId = a.PatientId
            }).ToListAsync();

            return result;
        }

        public async Task<IEnumerable<MedicalAppointment>> GetByPatientIdAsync(int patientId)
        {
            return await _dbContext.MedicalAppointments
                .Include(a => a.Hospital)
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Include(a => a.ReceptionStatus)
                .Include(a => a.PatientCard)
                .Where(a => a.PatientId == patientId)
                .ToListAsync();
        }

        public async Task<IEnumerable<MedicalAppointment>> GetByPatientCardIdAsync(int patientCardId)
        {
            return await _dbContext.MedicalAppointments
                .Include(a => a.Hospital)
                .Include(a => a.Patient)
                .Include(a => a.Doctor)
                .Include(a => a.ReceptionStatus)
                .Include(a => a.PatientCard)
                .Where(a => a.PatientCardId == patientCardId)
                .ToListAsync();
        }

        public async Task UpdatePatientCardAsync(int appointmentId, int patientCardId)
        {
            var appointment = await _dbContext.MedicalAppointments.FindAsync(appointmentId);
            if (appointment != null)
            {
                appointment.PatientCardId = patientCardId;
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task UpdateStatusAsync(int appointmentId, int receptionStatusId, string fileResultLink)
        {
            try
            {
                var appointment = await _dbContext.MedicalAppointments
                    .FirstOrDefaultAsync(a => a.MedicalAppointmentId == appointmentId);
                
                if (appointment != null)
                {
                    var statusExists = await _dbContext.ReceptionStatuses.AnyAsync(s => s.ReceptionStatusId == receptionStatusId);
                    if (!statusExists)
                    {
                        throw new Exception($"Статус с ID {receptionStatusId} не существует в базе данных");
                    }
                    
                    appointment.ReceptionStatusId = receptionStatusId;
                    await _dbContext.SaveChangesAsync();
                }
                else
                {
                    throw new Exception($"Запись о приеме с ID {appointmentId} не найдена");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при обновлении статуса: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Внутренняя ошибка: {ex.InnerException.Message}");
                }
                throw; // Пробрасываем исключение дальше
            }
        }
    }
}
