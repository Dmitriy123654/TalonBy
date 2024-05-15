

namespace BLL.Services
{
    public interface IHospitalService
    {
        List<IHospital> GetAllHospitals();
    }

    public class HospitalService : IHospitalService
    {
        private IHospitalRepository hospitalRepository;

        public HospitalService(IHospitalRepository hospitalRepository)
        {
            this.hospitalRepository = hospitalRepository;
        }

        public List<IHospital> GetAllHospitals()
        {
            return hospitalRepository.GetAllHospitals();
        }
    }
}
