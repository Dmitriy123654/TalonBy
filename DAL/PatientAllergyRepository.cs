using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class PatientAllergyRepository : IPatientAllergyRepository
    {
        private readonly ApplicationContext db;

        public PatientAllergyRepository(ApplicationContext dbContext)
        {
            db = dbContext;
        }

        public async Task<PatientAllergy> AddPatientAllergyAsync(PatientAllergy allergy)
        {
            await db.PatientAllergies.AddAsync(allergy);
            await db.SaveChangesAsync();
            return allergy;
        }

        public async Task DeletePatientAllergyAsync(int allergyId)
        {
            var allergy = await db.PatientAllergies.FindAsync(allergyId);
            if (allergy != null)
            {
                db.PatientAllergies.Remove(allergy);
                await db.SaveChangesAsync();
            }
        }

        public async Task<List<PatientAllergy>> GetAllergiesByPatientCardIdAsync(int patientCardId)
        {
            return await db.PatientAllergies
                .Where(a => a.PatientCardId == patientCardId)
                .ToListAsync();
        }

        public async Task<PatientAllergy> GetPatientAllergyByIdAsync(int allergyId)
        {
            return await db.PatientAllergies
                .Include(a => a.PatientCard)
                .FirstOrDefaultAsync(a => a.AllergyId == allergyId);
        }

        public async Task<bool> PatientAllergyExistsAsync(int allergyId)
        {
            return await db.PatientAllergies.AnyAsync(a => a.AllergyId == allergyId);
        }

        public async Task<PatientAllergy> UpdatePatientAllergyAsync(PatientAllergy allergy)
        {
            db.PatientAllergies.Update(allergy);
            await db.SaveChangesAsync();
            return allergy;
        }
    }
} 