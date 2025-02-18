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
            return await _doctorRepository.GetBySpecialityAsync(specialityId);
        }

       
    }
}
