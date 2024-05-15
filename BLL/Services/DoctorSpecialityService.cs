using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Crypto;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Services
{
    public interface IDoctorsSpecialityService
    {
        Task<List<DoctorsSpeciality>> GetAllDoctorsSpecialitiesAsync();
        Task<DoctorsSpeciality> GetDoctorsSpecialityByIdAsync(int id);
        Task<int> CreateDoctorsSpecialityAsync(DoctorsSpecialityModel specialityModel);
        Task UpdateDoctorsSpecialityAsync(int id, DoctorsSpecialityModel specialityModel);
        Task DeleteDoctorsSpecialityAsync(int id);
    }
    public class DoctorsSpecialityService : IDoctorsSpecialityService
    {
        private readonly IDoctorsSpecialityRepository _doctorsSpecialityRepository;

        public DoctorsSpecialityService(IDoctorsSpecialityRepository doctorsSpecialityRepository)
        {
            _doctorsSpecialityRepository = doctorsSpecialityRepository;
        }

        public async Task<List<DoctorsSpeciality>> GetAllDoctorsSpecialitiesAsync()
        {
            return await _doctorsSpecialityRepository.GetAllAsync();
        }

        public async Task<DoctorsSpeciality> GetDoctorsSpecialityByIdAsync(int id)
        {
            return await _doctorsSpecialityRepository.GetByIdAsync(id);
        }

        public async Task<int> CreateDoctorsSpecialityAsync(DoctorsSpecialityModel specialityModel)
        {
            var speciality = new DoctorsSpeciality
            {
                Name = specialityModel.Name
            };

            await _doctorsSpecialityRepository.AddAsync(speciality);
            return speciality.DoctorsSpecialityId;
        }


        public async Task UpdateDoctorsSpecialityAsync(int id, DoctorsSpecialityModel specialityModel)
        {
            var speciality = await _doctorsSpecialityRepository.GetByIdAsync(id);
            if (speciality != null)
            {
                speciality.Name = specialityModel.Name;
                await _doctorsSpecialityRepository.UpdateAsync(speciality);
            }
        }

        public async Task DeleteDoctorsSpecialityAsync(int id)
        {
            await _doctorsSpecialityRepository.DeleteAsync(id);
        }
    }
}
