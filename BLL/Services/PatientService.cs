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
        Task<Patient> AddPatientAsync(int userId, PatientModel patientModel);
        Task<Patient> UpdatePatientAsync(int userId, PatientModel patientUpdateModel);
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
        private IUserRepository userRepository;

        public PatientService(IPatientRepository patientRepository, IUserRepository userRepository)
        {
            this.patientRepository = patientRepository;
            this.userRepository = userRepository;
        }

        public async Task<Patient> AddPatientAsync(int userId, PatientModel patientModel)
        {
            // Проверяем, существует ли пользователь
            var user = await userRepository.GetUserByIdAsync(userId);
            if (user == null)
            {
                throw new Exception($"Пользователь с ID {userId} не найден");
            }

            // Создаем нового пациента
            var patient = new Patient
            {
                UserId = userId,
                Name = patientModel.Name,
                Gender = patientModel.Gender,
                DateOfBirth = patientModel.DateOfBirth,
                Address = patientModel.Address,
            };

            // Добавляем пациента
            var addedPatient = await patientRepository.AddPatientAsync(patient);
            return addedPatient;
        }

        public async Task<Patient> UpdatePatientAsync(int userId, PatientModel patientUpdateModel)
        {
            // Проверяем, существует ли пациент
            var patient = await patientRepository.GetPatientByIdAsync(patientUpdateModel.PatientId);
            if (patient == null)
            {
                throw new Exception($"Пациент с ID {patientUpdateModel.PatientId} не найден");
            }

            // Проверяем, принадлежит ли пациент указанному пользователю
            if (patient.UserId != userId)
            {
                throw new Exception("У вас нет прав на изменение этого пациента");
            }

            // Обновляем данные пациента
            patient.Name = patientUpdateModel.Name;
            patient.Gender = patientUpdateModel.Gender;
            patient.DateOfBirth = patientUpdateModel.DateOfBirth;
            patient.Address = patientUpdateModel.Address;

            // Сохраняем изменения
            var updatedPatient = await patientRepository.UpdatePatientAsync(patient);
            return updatedPatient;
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
            var patient = await patientRepository.GetPatientByUserIdAsync(userId);
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
