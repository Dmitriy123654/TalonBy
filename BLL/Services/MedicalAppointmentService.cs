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
        Task<MedicalAppointment> CreateAppointmentFromTimeSlotAsync(int timeSlotId, int patientId);
        Task UpdateMedicalAppointmentAsync(int id, MedicalAppointmentModel model);
        Task DeleteMedicalAppointmentAsync(int id);
        Task<MedicalAppointment> GetMedicalAppointmentByIdAsync(int id);
        Task<IEnumerable<MedicalAppointmentDTO>> GetMedicalAppointmentsAsync(MedicalAppointmentSearchParameters parameters);
    }

    public class MedicalAppointmentService : IMedicalAppointmentService
    {
        private readonly IMedicalAppointmentRepository _medicalAppointmentRepository;
        private readonly ITimeSlotRepository _timeSlotRepository;

        public MedicalAppointmentService(
            IMedicalAppointmentRepository medicalAppointmentRepository, 
            ITimeSlotRepository timeSlotRepository)
        {
            _medicalAppointmentRepository = medicalAppointmentRepository;
            _timeSlotRepository = timeSlotRepository;
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
                Time = model.Time
            };
            return await _medicalAppointmentRepository.CreateAsync(appointment);
        }

        public async Task<MedicalAppointment> CreateAppointmentFromTimeSlotAsync(int timeSlotId, int patientId)
        {
            var timeSlot = await _timeSlotRepository.GetTimeSlotByIdAsync(timeSlotId);
            if (timeSlot == null)
                throw new Exception($"TimeSlot с ID {timeSlotId} не найден.");

            if (!timeSlot.IsAvailable)
                throw new Exception($"TimeSlot с ID {timeSlotId} уже занят.");

            // Создаем запись о приеме
            var appointment = new MedicalAppointment
            {
                HospitalId = timeSlot.HospitalId ?? throw new Exception("В TimeSlot отсутствует HospitalId"),
                PatientId = patientId,
                DoctorId = timeSlot.DoctorId,
                ReceptionStatusId = 1, // Предполагаем, что ID 1 означает "Запланирован"
                Date = timeSlot.Date,
                Time = timeSlot.Time
            };

            // Создаем запись и обновляем timeSlot (помечаем как занятый)
            var createdAppointment = await _medicalAppointmentRepository.CreateAsync(appointment);
            
            timeSlot.IsAvailable = false;
            await _timeSlotRepository.UpdateTimeSlotAsync(timeSlot);

            return createdAppointment;
        }

        public async Task UpdateMedicalAppointmentAsync(int id, MedicalAppointmentModel model)
        {
            var appointment = await _medicalAppointmentRepository.GetByIdAsync(id);
            if (appointment == null)
                throw new Exception($"MedicalAppointment с ID {id} не найден.");

            appointment.HospitalId = model.HospitalId;
            appointment.PatientId = model.PatientId;
            appointment.DoctorId = model.DoctorId;
            appointment.ReceptionStatusId = model.ReceptionStatusId;
            appointment.Date = model.Date;
            appointment.Time = model.Time;

            await _medicalAppointmentRepository.UpdateAsync(appointment);
        }

        public async Task DeleteMedicalAppointmentAsync(int id)
        {
            var appointment = await _medicalAppointmentRepository.GetByIdAsync(id);
            if (appointment == null)
                throw new Exception($"MedicalAppointment с ID {id} не найден.");

            // Найти и освободить соответствующий TimeSlot, если он есть
            var timeSlots = await _timeSlotRepository.GetTimeSlotsForDateAsync(appointment.DoctorId, appointment.Date);
            var relevantTimeSlot = timeSlots.FirstOrDefault(ts => 
                ts.Time <= appointment.Time && 
                ts.Time.Add(TimeSpan.FromMinutes(ts.Duration)) > appointment.Time && 
                !ts.IsAvailable);

            if (relevantTimeSlot != null)
            {
                relevantTimeSlot.IsAvailable = true;
                await _timeSlotRepository.UpdateTimeSlotAsync(relevantTimeSlot);
            }

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
