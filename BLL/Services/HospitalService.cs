

using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;

namespace BLL.Services
{
    public interface IHospitalService
    {
        List<Hospital> GetAllHospitals();
        Hospital GetById(int id);
        void Add(HospitalModel hospitalModel);
        void Update(HospitalModel hospitalModel, int id);
        void Delete(int id);
        IEnumerable<Hospital> SearchHospitals(HospitalSearchParameters parameters);
    }

    public class HospitalService : IHospitalService
    {
        private readonly IHospitalRepository _hospitalRepository;

        public HospitalService(IHospitalRepository hospitalRepository)
        {
            _hospitalRepository = hospitalRepository;
        }

        public List<Hospital> GetAllHospitals()
        {
            return _hospitalRepository.GetAll().ToList();
        }

        public Hospital GetById(int id)
        {
            return _hospitalRepository.GetById(id);
        }

        public void Add(HospitalModel hospitalModel)
        {
            var hospital = new Hospital
            {
                Name = hospitalModel.Name,
                Address = hospitalModel.Address,
                Type = hospitalModel.Type,
                WorkingHours = hospitalModel.WorkingHours,
                Phones = hospitalModel.Phones,
                Email = hospitalModel.Email,
                Description = hospitalModel.Description
            };

            _hospitalRepository.Add(hospital);
        }

        public void Update(HospitalModel hospitalModel, int id)
        {
            var hospital = _hospitalRepository.GetById(id);
            if (hospital != null)
            {
                hospital.Name = hospitalModel.Name;
                hospital.Address = hospitalModel.Address;
                hospital.Type = hospitalModel.Type;
                hospital.WorkingHours = hospitalModel.WorkingHours;
                hospital.Phones = hospitalModel.Phones;
                hospital.Email = hospitalModel.Email;
                hospital.Description = hospitalModel.Description;

                _hospitalRepository.Update(hospital);
            }
        }

        public void Delete(int id)
        {
            _hospitalRepository.Delete(id);
        }
        public IEnumerable<Hospital> SearchHospitals(HospitalSearchParameters parameters)
        {
            return _hospitalRepository.SearchHospitals(parameters);
        }
    }

}
