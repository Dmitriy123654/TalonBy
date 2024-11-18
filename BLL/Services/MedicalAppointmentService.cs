using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Services
{
    public interface IMedicalAppointmentService
    {
        Task<MedicalAppointment> CreateMedicalAppointmentAsync(MedicalAppointmentModel model);
        Task UpdateMedicalAppointmentAsync(int id, MedicalAppointmentModel model);
        Task DeleteMedicalAppointmentAsync(int id);
        Task<MedicalAppointment> GetMedicalAppointmentByIdAsync(int id);
        Task<IEnumerable<MedicalAppointmentDTO>> GetMedicalAppointmentsAsync(MedicalAppointmentSearchParameters parameters);
    }

    public class MedicalAppointmentService : IMedicalAppointmentService
    {
        private readonly IMedicalAppointmentRepository _medicalAppointmentRepository;

        public MedicalAppointmentService(IMedicalAppointmentRepository medicalAppointmentRepository)
        {
            _medicalAppointmentRepository = medicalAppointmentRepository;
        }

        public async Task<MedicalAppointment> CreateMedicalAppointmentAsync(MedicalAppointmentModel model)
        {
            var appointment = new MedicalAppointment
            {
                HospitalId = model.HospitalId,
                PatientId = model.PatientId,
                DoctorId = model.DoctorId,
                ReceptionStatusId = model.ReceptionStatusId,
                Date = model.Date,
                Time = model.Time,
                TextResult = model.TextResult,
                Description = model.Description
            };
            return await _medicalAppointmentRepository.CreateAsync(appointment);
        }

        public async Task UpdateMedicalAppointmentAsync(int id, MedicalAppointmentModel model)
        {
            var appointment = await _medicalAppointmentRepository.GetByIdAsync(id);
            if (appointment == null)
                throw new Exception($"MedicalAppointment with ID {id} not found.");

            appointment.HospitalId = model.HospitalId;
            appointment.PatientId = model.PatientId;
            appointment.DoctorId = model.DoctorId;
            appointment.ReceptionStatusId = model.ReceptionStatusId;
            appointment.Date = model.Date;
            appointment.Time = model.Time;
            appointment.TextResult = model.TextResult;
            appointment.Description = model.Description;

            await _medicalAppointmentRepository.UpdateAsync(appointment);
        }

        public async Task DeleteMedicalAppointmentAsync(int id)
        {
            var appointment = await _medicalAppointmentRepository.GetByIdAsync(id);
            if (appointment == null)
                throw new Exception($"MedicalAppointment with ID {id} not found.");

            await _medicalAppointmentRepository.DeleteAsync(appointment);
        }

        public async Task<MedicalAppointment> GetMedicalAppointmentByIdAsync(int id)
        {
            return await _medicalAppointmentRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<MedicalAppointmentDTO>> GetMedicalAppointmentsAsync(MedicalAppointmentSearchParameters parameters)
        {
            return await _medicalAppointmentRepository.GetAllAsync(parameters);
        }
    }
}
