using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BLL.Services
{
    public interface IPatientService
    {
        Patient UpdatePatient(int userId, PatientModel patientUpdateModel);
    }
    public class PatientService : IPatientService
    {
        private IPatientRepository patientRepository;

        public PatientService(IPatientRepository patientRepository)
        {
            this.patientRepository = patientRepository;
        }
        public Patient UpdatePatient(int userId, PatientModel patientUpdateModel)
        {
            var patient = patientRepository.GetPatientByUserId(userId);
            if (patient == null)
            {
                throw new Exception("Patient not found");
            }

            patient.Name = patientUpdateModel.Name;
            patient.Gender = patientUpdateModel.Gender;
            patient.DateOfBirth = patientUpdateModel.DateOfBirth;
            patient.Address = patientUpdateModel.Address;

            return patientRepository.UpdatePatient(patient);
        }
    }
}
