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
        Task<MedicalAppointment> CreateAppointmentFromTimeSlotAsync(int timeSlotId, int patientId, int receptionStatusId = 4);
        Task UpdateMedicalAppointmentAsync(int id, MedicalAppointmentModel model);
        Task DeleteMedicalAppointmentAsync(int id);
        Task<MedicalAppointment> GetMedicalAppointmentByIdAsync(int id);
        Task<IEnumerable<MedicalAppointmentDTO>> GetMedicalAppointmentsAsync(MedicalAppointmentSearchParameters parameters);
        Task<IEnumerable<MedicalAppointment>> GetMedicalAppointmentsByPatientIdAsync(int patientId);
        Task<IEnumerable<MedicalAppointment>> GetMedicalAppointmentsByPatientCardIdAsync(int patientCardId);
        Task UpdateAppointmentPatientCardAsync(int appointmentId, int patientCardId);
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
                Time = model.Time,
                PatientCardId = model.PatientCardId
            };
            return await _medicalAppointmentRepository.CreateAsync(appointment);
        }

        public async Task<MedicalAppointment> CreateAppointmentFromTimeSlotAsync(int timeSlotId, int patientId, int receptionStatusId = 4)
        {
            var timeSlot = await _timeSlotRepository.GetTimeSlotByIdAsync(timeSlotId);
            if (timeSlot == null)
                throw new Exception($"TimeSlot с ID {timeSlotId} не найден.");

            if (!timeSlot.IsAvailable)
                throw new Exception($"TimeSlot с ID {timeSlotId} уже занят.");

            try
            {
                // Создаем запись о приеме
                var appointment = new MedicalAppointment
                {
                    HospitalId = timeSlot.HospitalId ?? throw new Exception("В TimeSlot отсутствует HospitalId"),
                    PatientId = patientId,
                    DoctorId = timeSlot.DoctorId,
                    // Статус ожидания (Waiting) имеет ID=4 в базе
                    ReceptionStatusId = 4, // Status.Waiting - жестко задаем ID=4, так как это точно существует в БД
                    Date = timeSlot.Date,
                    Time = timeSlot.Time
                    // PatientCardId будет установлен позже, если необходимо
                };

                // Создаем запись и обновляем timeSlot (помечаем как занятый)
                var createdAppointment = await _medicalAppointmentRepository.CreateAsync(appointment);
            
                timeSlot.IsAvailable = false;
                await _timeSlotRepository.UpdateTimeSlotAsync(timeSlot);

                return createdAppointment;
            }
            catch (Exception ex)
            {
                throw new Exception($"Ошибка при создании записи: {ex.Message}", ex);
            }
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
            appointment.PatientCardId = model.PatientCardId;

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

        public async Task<IEnumerable<MedicalAppointment>> GetMedicalAppointmentsByPatientIdAsync(int patientId)
        {
            return await _medicalAppointmentRepository.GetByPatientIdAsync(patientId);
        }

        public async Task<IEnumerable<MedicalAppointment>> GetMedicalAppointmentsByPatientCardIdAsync(int patientCardId)
        {
            return await _medicalAppointmentRepository.GetByPatientCardIdAsync(patientCardId);
        }

        public async Task UpdateAppointmentPatientCardAsync(int appointmentId, int patientCardId)
        {
            await _medicalAppointmentRepository.UpdatePatientCardAsync(appointmentId, patientCardId);
        }
    }
}
