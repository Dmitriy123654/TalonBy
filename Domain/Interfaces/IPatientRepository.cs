using Domain.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IPatientRepository
    {
        Patient GetPatientByUserId(int userId);
        Patient UpdatePatient(Patient patient);
        Task<List<Patient>> GetAllPatientsAsync();
        Task<Patient> GetPatientByIdAsync(int patientId);
        Task DeletePatientAsync(int patientId);
        Task<bool> PatientExistsAsync(int patientId);
        Task<List<Patient>> GetPatientsByUserIdAsync(int userId);
    }
}
