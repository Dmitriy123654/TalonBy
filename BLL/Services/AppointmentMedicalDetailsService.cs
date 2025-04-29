using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BLL.Services
{
    public interface IAppointmentMedicalDetailsService
    {
        Task<AppointmentMedicalDetails> GetByIdAsync(int id);
        Task<AppointmentMedicalDetails> GetByAppointmentIdAsync(int appointmentId);
        Task<IEnumerable<AppointmentMedicalDetails>> GetAllAsync();
        Task<AppointmentMedicalDetails> CreateAsync(AppointmentMedicalDetailsModel model);
        Task<AppointmentMedicalDetails> UpdateAsync(int id, AppointmentMedicalDetailsModel model);
        Task<bool> DeleteAsync(int id);
    }

    public class AppointmentMedicalDetailsService : IAppointmentMedicalDetailsService
    {
        private readonly IAppointmentMedicalDetailsRepository _repository;

        public AppointmentMedicalDetailsService(IAppointmentMedicalDetailsRepository repository)
        {
            _repository = repository;
        }

        public async Task<AppointmentMedicalDetails> GetByIdAsync(int id)
        {
            return await _repository.GetByIdAsync(id);
        }

        public async Task<AppointmentMedicalDetails> GetByAppointmentIdAsync(int appointmentId)
        {
            return await _repository.GetByAppointmentIdAsync(appointmentId);
        }

        public async Task<IEnumerable<AppointmentMedicalDetails>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<AppointmentMedicalDetails> CreateAsync(AppointmentMedicalDetailsModel model)
        {
            var details = new AppointmentMedicalDetails
            {
                MedicalAppointmentId = model.MedicalAppointmentId,
                Diagnosis = model.Diagnosis,
                Treatment = model.Treatment,
                Prescriptions = model.Prescriptions,
                LabResults = model.LabResults,
                MedicalHistory = model.MedicalHistory,
                Allergies = model.Allergies,
                VitalSigns = model.VitalSigns,
                NextAppointmentDate = model.NextAppointmentDate
            };

            return await _repository.AddAsync(details);
        }

        public async Task<AppointmentMedicalDetails> UpdateAsync(int id, AppointmentMedicalDetailsModel model)
        {
            var details = await _repository.GetByIdAsync(id);
            if (details == null)
                throw new Exception($"AppointmentMedicalDetails с ID {id} не найден.");

            details.Diagnosis = model.Diagnosis;
            details.Treatment = model.Treatment;
            details.Prescriptions = model.Prescriptions;
            details.LabResults = model.LabResults;
            details.MedicalHistory = model.MedicalHistory;
            details.Allergies = model.Allergies;
            details.VitalSigns = model.VitalSigns;
            details.NextAppointmentDate = model.NextAppointmentDate;

            return await _repository.UpdateAsync(details);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            return await _repository.DeleteAsync(id);
        }
    }
} 