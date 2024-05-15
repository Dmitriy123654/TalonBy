using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace DAL
{
    public class DoctorRepository : IDoctorRepository
    {
        private readonly ApplicationContext _context;

        public DoctorRepository(ApplicationContext context)
        {
            _context = context;
        }

        public async Task<List<Doctor>> GetAllAsync()
        {
            return await _context.Doctors
                .Include(d => d.DoctorsSpeciality)
                .Include(d => d.Hospital)
                .ToListAsync();
        }

        public async Task<Doctor> GetByIdAsync(int id)
        {
            return await _context.Doctors
                .Include(d => d.DoctorsSpeciality)
                .Include(d => d.Hospital)
                .FirstOrDefaultAsync(d => d.DoctorId == id);
        }

        public async Task AddAsync(Doctor doctor)
        {
            await _context.Doctors.AddAsync(doctor);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Doctor doctor)
        {
            _context.Entry(doctor).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var doctor = await _context.Doctors.FindAsync(id);
            if (doctor != null)
            {
                _context.Doctors.Remove(doctor);
                await _context.SaveChangesAsync();
            }
        }
        public IEnumerable<Doctor> GetByHospitalId(int hospitalId)
        {
            return _context.Doctors
                .Where(d => d.HospitalId == hospitalId)
                .OrderBy(d => d.DoctorsSpeciality.Name)
                .ToList();
        }

        public IEnumerable<Doctor> GetBySpecialtyAndHospitalId(int hospitalId, int specialtyId)
        {
            return _context.Doctors
                .Where(d => d.HospitalId == hospitalId && d.DoctorsSpecialityId == specialtyId)
                .ToList();
        }
    }
}
