using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.EntityFrameworkCore;

namespace DAL
{

    public class HospitalRepository : IHospitalRepository
    {
        private readonly ApplicationContext _context;

        public HospitalRepository(ApplicationContext context)
        {
            _context = context;
        }

        public IEnumerable<Hospital> GetAll()
        {
            return _context.Hospitals.ToList();
        }

        public Hospital GetById(int id)
        {
            return _context.Hospitals.Find(id);
        }

        public void Add(Hospital hospital)
        {
            _context.Hospitals.Add(hospital);
            _context.SaveChanges();
        }

        public void Update(Hospital hospital)
        {
            _context.Entry(hospital).State = EntityState.Modified;
            _context.SaveChanges();
        }

        public void Delete(int id)
        {
            var hospital = _context.Hospitals.Find(id);
            if (hospital != null)
            {
                _context.Hospitals.Remove(hospital);
                _context.SaveChanges();
            }
        }
        public IEnumerable<Hospital> SearchHospitals(HospitalSearchParameters parameters)
        {
            var query = _context.Hospitals.AsQueryable();

            if (parameters.HospitalTypes != null && parameters.HospitalTypes.Any())
            {
                query = query.Where(h => parameters.HospitalTypes.Contains(h.Type));
            }

            if (!string.IsNullOrEmpty(parameters.Name))
            {
                query = query.Where(h => h.Name.Contains(parameters.Name));
            }

            return query.ToList();
        }
    }
}
