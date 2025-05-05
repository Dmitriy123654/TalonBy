using Domain.Interfaces;
using Domain.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DAL
{
    public class PatientCardRepository : IPatientCardRepository
    {
        private readonly ApplicationContext db;

        public PatientCardRepository(ApplicationContext dbContext)
        {
            db = dbContext;
        }

        public async Task<PatientCard> AddPatientCardAsync(PatientCard patientCard)
        {
            await db.PatientCards.AddAsync(patientCard);
            await db.SaveChangesAsync();
            return patientCard;
        }

        public async Task DeletePatientCardAsync(int patientCardId)
        {
            var patientCard = await db.PatientCards.FindAsync(patientCardId);
            if (patientCard != null)
            {
                db.PatientCards.Remove(patientCard);
                await db.SaveChangesAsync();
            }
        }

        public async Task<List<PatientCard>> GetAllPatientCardsAsync()
        {
            return await db.PatientCards
                .Include(p => p.Allergies)
                .Include(p => p.ChronicConditions)
                .Include(p => p.Immunizations)
                .Include(p => p.Patient)
                .ToListAsync();
        }

        public async Task<PatientCard> GetPatientCardByIdAsync(int patientCardId)
        {
            return await db.PatientCards
                .Include(p => p.Allergies)
                .Include(p => p.ChronicConditions)
                .Include(p => p.Immunizations)
                .Include(p => p.Patient)
                .FirstOrDefaultAsync(p => p.PatientCardId == patientCardId);
        }

        public async Task<PatientCard> GetPatientCardByPatientIdAsync(int patientId)
        {
            return await db.PatientCards
                .Include(p => p.Allergies)
                .Include(p => p.ChronicConditions)
                .Include(p => p.Immunizations)
                .Include(p => p.Patient)
                .FirstOrDefaultAsync(p => p.PatientId == patientId);
        }

        public async Task<bool> PatientCardExistsAsync(int patientCardId)
        {
            return await db.PatientCards.AnyAsync(p => p.PatientCardId == patientCardId);
        }

        public async Task<PatientCard> UpdatePatientCardAsync(PatientCard patientCard)
        {
            db.PatientCards.Update(patientCard);
            await db.SaveChangesAsync();
            return patientCard;
        }
    }
} 