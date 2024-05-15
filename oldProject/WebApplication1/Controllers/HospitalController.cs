using Microsoft.AspNetCore.Mvc;

namespace WebApplication1.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class HospitalController : Controller
    {
        private IHospitalService hospitalService;

        public HospitalController(IHospitalService hospitalService)
        {
            this.hospitalService = hospitalService;
        }
        [HttpGet(Name = "GetHospitals")]
        public IActionResult GetAllHospitals()
        {
            var hospitals = hospitalService.GetAllHospitals();
            // ¬ерните представление с данными больниц
            return View(hospitals);
        }
    }
   
}
