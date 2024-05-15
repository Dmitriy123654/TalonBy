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
        public Patient GetPatientByUserId(int userId)
        {
            return db.Patients.FirstOrDefault(p => p.UserId == userId);
        }

        public Patient UpdatePatient(Patient patient)
        {
            db.Patients.Update(patient);
            db.SaveChanges();
            return patient;
        }
    }
}
