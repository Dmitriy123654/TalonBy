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
    public interface IPatientService
    {
        Patient UpdatePatient(int userId, PatientModel patientUpdateModel);
        Task<List<Patient>> GetAllPatientsAsync();
        Task<Patient> GetPatientByIdAsync(int patientId);
        Task<Patient> GetPatientByUserIdAsync(int userId);
        Task DeletePatientAsync(int patientId);
        Task<bool> PatientExistsAsync(int patientId);
        Task<List<Patient>> GetPatientsByUserIdAsync(int userId);
    }

    public class PatientService : IPatientService
    {
        private IPatientRepository patientRepository;

        public PatientService(IPatientRepository patientRepository)
        {
            this.patientRepository = patientRepository;
        }

        public Patient UpdatePatient(int userId, PatientModel patientUpdateModel)
        {
            var patient = patientRepository.GetPatientByUserId(userId);
            if (patient == null)
            {
                throw new Exception("Пациент не найден");
            }

            patient.Name = patientUpdateModel.Name;
            patient.Gender = patientUpdateModel.Gender;
            patient.DateOfBirth = patientUpdateModel.DateOfBirth;
            patient.Address = patientUpdateModel.Address;

            return patientRepository.UpdatePatient(patient);
        }

        public async Task<List<Patient>> GetAllPatientsAsync()
        {
            return await patientRepository.GetAllPatientsAsync();
        }

        public async Task<Patient> GetPatientByIdAsync(int patientId)
        {
            var patient = await patientRepository.GetPatientByIdAsync(patientId);
            if (patient == null)
            {
                throw new Exception($"Пациент с ID {patientId} не найден");
            }
            return patient;
        }

        public async Task<Patient> GetPatientByUserIdAsync(int userId)
        {
            var patient = patientRepository.GetPatientByUserId(userId);
            if (patient == null)
            {
                throw new Exception($"Пациент с ID пользователя {userId} не найден");
            }
            return patient;
        }

        public async Task DeletePatientAsync(int patientId)
        {
            var exists = await patientRepository.PatientExistsAsync(patientId);
            if (!exists)
            {
                throw new Exception($"Пациент с ID {patientId} не найден");
            }
            await patientRepository.DeletePatientAsync(patientId);
        }

        public async Task<bool> PatientExistsAsync(int patientId)
        {
            return await patientRepository.PatientExistsAsync(patientId);
        }

        public async Task<List<Patient>> GetPatientsByUserIdAsync(int userId)
        {
            return await patientRepository.GetPatientsByUserIdAsync(userId);
        }
    }
}
