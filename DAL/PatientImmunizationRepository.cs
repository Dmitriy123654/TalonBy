using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class PatientImmunizationRepository : IPatientImmunizationRepository
    {
        private readonly ApplicationContext db;

        public PatientImmunizationRepository(ApplicationContext dbContext)
        {
            db = dbContext;
        }

        public async Task<PatientImmunization> AddPatientImmunizationAsync(PatientImmunization immunization)
        {
            await db.PatientImmunizations.AddAsync(immunization);
            await db.SaveChangesAsync();
            return immunization;
        }

        public async Task DeletePatientImmunizationAsync(int immunizationId)
        {
            var immunization = await db.PatientImmunizations.FindAsync(immunizationId);
            if (immunization != null)
            {
                db.PatientImmunizations.Remove(immunization);
                await db.SaveChangesAsync();
            }
        }

        public async Task<List<PatientImmunization>> GetImmunizationsByPatientCardIdAsync(int patientCardId)
        {
            return await db.PatientImmunizations
                .Where(i => i.PatientCardId == patientCardId)
                .ToListAsync();
        }

        public async Task<PatientImmunization> GetPatientImmunizationByIdAsync(int immunizationId)
        {
            return await db.PatientImmunizations
                .Include(i => i.PatientCard)
                .FirstOrDefaultAsync(i => i.ImmunizationId == immunizationId);
        }

        public async Task<bool> PatientImmunizationExistsAsync(int immunizationId)
        {
            return await db.PatientImmunizations.AnyAsync(i => i.ImmunizationId == immunizationId);
        }

        public async Task<PatientImmunization> UpdatePatientImmunizationAsync(PatientImmunization immunization)
        {
            db.PatientImmunizations.Update(immunization);
            await db.SaveChangesAsync();
            return immunization;
        }
    }
} 