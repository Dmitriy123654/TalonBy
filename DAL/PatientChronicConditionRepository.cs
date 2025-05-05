using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class PatientChronicConditionRepository : IPatientChronicConditionRepository
    {
        private readonly ApplicationContext db;

        public PatientChronicConditionRepository(ApplicationContext dbContext)
        {
            db = dbContext;
        }

        public async Task<PatientChronicCondition> AddPatientChronicConditionAsync(PatientChronicCondition condition)
        {
            await db.PatientChronicConditions.AddAsync(condition);
            await db.SaveChangesAsync();
            return condition;
        }

        public async Task DeletePatientChronicConditionAsync(int conditionId)
        {
            var condition = await db.PatientChronicConditions.FindAsync(conditionId);
            if (condition != null)
            {
                db.PatientChronicConditions.Remove(condition);
                await db.SaveChangesAsync();
            }
        }

        public async Task<List<PatientChronicCondition>> GetChronicConditionsByPatientCardIdAsync(int patientCardId)
        {
            return await db.PatientChronicConditions
                .Where(c => c.PatientCardId == patientCardId)
                .ToListAsync();
        }

        public async Task<PatientChronicCondition> GetPatientChronicConditionByIdAsync(int conditionId)
        {
            return await db.PatientChronicConditions
                .Include(c => c.PatientCard)
                .FirstOrDefaultAsync(c => c.ConditionId == conditionId);
        }

        public async Task<bool> PatientChronicConditionExistsAsync(int conditionId)
        {
            return await db.PatientChronicConditions.AnyAsync(c => c.ConditionId == conditionId);
        }

        public async Task<PatientChronicCondition> UpdatePatientChronicConditionAsync(PatientChronicCondition condition)
        {
            db.PatientChronicConditions.Update(condition);
            await db.SaveChangesAsync();
            return condition;
        }
    }
} 