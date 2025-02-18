using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class DoctorsSpecialityRepository : IDoctorsSpecialityRepository
    {
        private readonly ApplicationContext _context;

        public DoctorsSpecialityRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<List<DoctorsSpeciality>> GetAllAsync()
        {
            return await _context.DoctorsSpecialities.ToListAsync();
        }

        public async Task<DoctorsSpeciality> GetByIdAsync(int id)
        {
            return await _context.DoctorsSpecialities.FindAsync(id);
        }

        public async Task AddAsync(DoctorsSpeciality speciality)
        {
            await _context.DoctorsSpecialities.AddAsync(speciality);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(DoctorsSpeciality speciality)
        {
            _context.Entry(speciality).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var speciality = await _context.DoctorsSpecialities.FindAsync(id);
            if (speciality != null)
            {
                _context.DoctorsSpecialities.Remove(speciality);
                await _context.SaveChangesAsync();
            }
        }

        public IEnumerable<DoctorsSpeciality> GetByHospitalId(int hospitalId)
        {
            return _context.DoctorsSpecialities
                .Where(ds => _context.Doctors
                    .Any(d => d.HospitalId == hospitalId
                               && d.DoctorsSpecialityId == ds.DoctorsSpecialityId))
                .Where(ds => ds.DoctorsSpecialityId != 1 && ds.DoctorsSpecialityId != 2)
                .ToList();
        }
    }
}
