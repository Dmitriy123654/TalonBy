
using DAL.Models;


namespace DAL
{
    
    public class HospitalRepository : IHospitalRepository
    {
        private ApplicationContext db; // Здесь YourDbContext представляет ваш контекст Entity Framework

        public HospitalRepository(ApplicationContext dbContext)
        {
            db = dbContext;
        }

        public List<Hospital> GetAllHospitals()
        {
            return db.Hospitals.ToList();
        }

    }
}
