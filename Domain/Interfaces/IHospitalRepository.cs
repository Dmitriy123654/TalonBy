using Domain.Models;
using Domain.ViewModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Interfaces
{
    public interface IHospitalRepository
    {
        IEnumerable<Hospital> GetAll();
        Hospital GetById(int id);
        void Add(Hospital hospital);
        void Update(Hospital hospital);
        void Delete(int id);
        IEnumerable<Hospital> SearchHospitals(HospitalSearchParameters parameters);
    }


}
