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
    public interface IDoctorService
    {
        Task<List<Doctor>> GetAllDoctorsAsync();
        Task<Doctor> GetDoctorByIdAsync(int id);
        Task CreateDoctorAsync(DoctorModel doctorModel);
        Task UpdateDoctorAsync(int id, DoctorModel doctorModel);
        Task DeleteDoctorAsync(int id);
        IEnumerable<Doctor> GetDoctorsByHospital(int hospitalId);
        IEnumerable<Doctor> GetDoctorsBySpecialtyAndHospital(int hospitalId, int specialtyId);
        Task<IEnumerable<Doctor>> GetDoctorsBySpecialityAsync(int specialityId);
        Task<object> GetDoctorByUserIdAsync(string userId);
        Task<object> GetChiefDoctorByUserIdAsync(string userId);
    }
    public class DoctorService : IDoctorService
    {
        private readonly IDoctorRepository _doctorRepository;
        private readonly IDoctorsSpecialityRepository _specialityRepository;

        public DoctorService(IDoctorRepository doctorRepository, IDoctorsSpecialityRepository specialityRepository)
        {
            _doctorRepository = doctorRepository;
            _specialityRepository = specialityRepository;
        }

        public async Task<List<Doctor>> GetAllDoctorsAsync()
        {
            return await _doctorRepository.GetAllAsync();
        }

        public async Task<Doctor> GetDoctorByIdAsync(int id)
        {
            return await _doctorRepository.GetByIdAsync(id);
        }

        public async Task CreateDoctorAsync(DoctorModel doctorModel)
        {
            var doctor = new Doctor
            {
                HospitalId = doctorModel.HospitalId,
                DoctorsSpecialityId = doctorModel.DoctorsSpecialityId,
                FullName = doctorModel.FullName,
                Photo = doctorModel.Photo,
                WorkingHours = doctorModel.WorkingHours,
                Office = doctorModel.Office,
                AdditionalInfo = doctorModel.AdditionalInfo
            };

            await _doctorRepository.AddAsync(doctor);
        }

        public async Task UpdateDoctorAsync(int id, DoctorModel doctorModel)
        {
            var doctor = await _doctorRepository.GetByIdAsync(id);
            if (doctor != null)
            {
                doctor.HospitalId = doctorModel.HospitalId;
                doctor.DoctorsSpecialityId = doctorModel.DoctorsSpecialityId;
                doctor.FullName = doctorModel.FullName;
                doctor.Photo = doctorModel.Photo;
                doctor.WorkingHours = doctorModel.WorkingHours;
                doctor.Office = doctorModel.Office;
                doctor.AdditionalInfo = doctorModel.AdditionalInfo;


                await _doctorRepository.UpdateAsync(doctor);
            }
        }

        public async Task DeleteDoctorAsync(int id)
        {
            await _doctorRepository.DeleteAsync(id);
        }
        public IEnumerable<Doctor> GetDoctorsByHospital(int hospitalId)
        {
            return _doctorRepository.GetByHospitalId(hospitalId);
        }

        public IEnumerable<Doctor> GetDoctorsBySpecialtyAndHospital(int hospitalId, int specialtyId)
        {
            return _doctorRepository.GetBySpecialtyAndHospitalId(hospitalId, specialtyId);
        }

        public async Task<IEnumerable<Doctor>> GetDoctorsBySpecialityAsync(int specialityId)
        {
            return await _doctorRepository.GetDoctorsBySpecialityIdAsync(specialityId);
        }

        public async Task<object> GetDoctorByUserIdAsync(string userId)
        {
            // Преобразуем строковый ID в числовой
            if (!int.TryParse(userId, out int userIdInt))
            {
                throw new ArgumentException("Некорректный ID пользователя");
            }
            
            try
            {
                // Ищем доктора по ID пользователя
                var doctor = await _doctorRepository.GetByUserIdAsync(userIdInt);
                if (doctor == null)
                {
                    return null;
                }
                
                // Возвращаем данные в формате, ожидаемом клиентским приложением
                return new 
                {
                    doctorId = doctor.DoctorId,
                    hospitalId = doctor.HospitalId,
                    fullName = doctor.FullName,
                    specialization = doctor.DoctorsSpeciality?.Name
                };
            }
            catch (Exception ex)
            {
                // Логируем ошибку и возвращаем null для обработки на более высоком уровне
                Console.WriteLine($"Ошибка при получении врача по UserId {userId}: {ex.Message}");
                return null;
            }
        }

        public async Task<object> GetChiefDoctorByUserIdAsync(string userId)
        {
            // Преобразуем строковый ID в числовой
            if (!int.TryParse(userId, out int userIdInt))
            {
                throw new ArgumentException("Некорректный ID пользователя");
            }
            
            try
            {
                // Ищем доктора по ID пользователя
                var doctor = await _doctorRepository.GetByUserIdAsync(userIdInt);
                if (doctor == null)
                {
                    return null;
                }
                
                // Проверяем, является ли врач главврачом 
                // В данном случае просто возвращаем найденные данные, но в будущем тут можно добавить проверку роли
                
                return new 
                {
                    doctorId = doctor.DoctorId,
                    hospitalId = doctor.HospitalId,
                    fullName = doctor.FullName,
                    specialization = doctor.DoctorsSpeciality?.Name
                };
            }
            catch (Exception ex)
            {
                // Логируем ошибку и возвращаем null для обработки на более высоком уровне
                Console.WriteLine($"Ошибка при получении главврача по UserId {userId}: {ex.Message}");
                return null;
            }
        }
    }
}
