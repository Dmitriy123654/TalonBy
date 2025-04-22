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
    public class PatientRepository : IPatientRepository
    {
        private ApplicationContext db; 

        public PatientRepository(ApplicationContext dbContext)
        {
            db = dbContext;
        }
        
        // Этот метод теперь возвращает первого пациента пользователя (для обратной совместимости)
        public Patient GetPatientByUserId(int userId)
        {
            return db.Patients
                .Include(p => p.User)
                .FirstOrDefault(p => p.UserId == userId);
        }

        public Patient UpdatePatient(Patient patient)
        {
            db.Patients.Update(patient);
            db.SaveChanges();
            return patient;
        }

        public async Task<List<Patient>> GetAllPatientsAsync()
        {
            return await db.Patients
                .Include(p => p.User)
                .ToListAsync();
        }

        public async Task<Patient> GetPatientByIdAsync(int patientId)
        {
            return await db.Patients
                .Include(p => p.User)
                .FirstOrDefaultAsync(p => p.PatientId == patientId);
        }

        public async Task DeletePatientAsync(int patientId)
        {
            var patient = await db.Patients.FindAsync(patientId);
            if (patient != null)
            {
                db.Patients.Remove(patient);
                await db.SaveChangesAsync();
            }
        }

        public async Task<bool> PatientExistsAsync(int patientId)
        {
            return await db.Patients.AnyAsync(p => p.PatientId == patientId);
        }

        public async Task<List<Patient>> GetPatientsByUserIdAsync(int userId)
        {
            return await db.Patients
                .Include(p => p.User)
                .Where(p => p.UserId == userId)
                .ToListAsync();
        }
    }
}
