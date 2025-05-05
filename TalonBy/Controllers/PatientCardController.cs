using BLL.Services;
using Domain;
using Domain.Models;
using Domain.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace TalonBy.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    //[Authorize]
    public class PatientCardController : ControllerBase
    {
        private readonly IPatientCardService _patientCardService;
        private readonly IPatientService _patientService;

        public PatientCardController(IPatientCardService patientCardService, IPatientService patientService)
        {
            _patientCardService = patientCardService;
            _patientService = patientService;
        }

        // PatientCard endpoints
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PatientCardViewModel>>> GetAllPatientCards()
        {
            var patientCards = await _patientCardService.GetAllPatientCardsAsync();
            var viewModels = patientCards.Select(MapToViewModel).ToList();
            return Ok(viewModels);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PatientCardViewModel>> GetPatientCardById(int id)
        {
            var patientCard = await _patientCardService.GetPatientCardByIdAsync(id);
            if (patientCard == null)
                return NotFound();

            return Ok(MapToViewModel(patientCard));
        }

        [HttpGet("patient/{patientId}")]
        public async Task<ActionResult<PatientCardViewModel>> GetPatientCardByPatientId(int patientId)
        {
            var patientCard = await _patientCardService.GetPatientCardByPatientIdAsync(patientId);
            if (patientCard == null)
                return NotFound();

            return Ok(MapToViewModel(patientCard));
        }

        [HttpPost]
        public async Task<ActionResult<PatientCardViewModel>> CreatePatientCard(PatientCardViewModel viewModel)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            // Check if patient exists if specified
            if (viewModel.PatientId.HasValue)
            {
                var patientExists = await _patientService.PatientExistsAsync(viewModel.PatientId.Value);
                if (!patientExists)
                    return BadRequest("Specified patient does not exist");
            }

            var patientCard = MapToModel(viewModel);
            var createdPatientCard = await _patientCardService.AddPatientCardAsync(patientCard);
            
            return CreatedAtAction(nameof(GetPatientCardById), new { id = createdPatientCard.PatientCardId }, MapToViewModel(createdPatientCard));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePatientCard(int id, PatientCardViewModel viewModel)
        {
            if (id != viewModel.PatientCardId)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var patientCardExists = await _patientCardService.PatientCardExistsAsync(id);
            if (!patientCardExists)
                return NotFound();

            var patientCard = MapToModel(viewModel);
            await _patientCardService.UpdatePatientCardAsync(patientCard);

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePatientCard(int id)
        {
            var patientCardExists = await _patientCardService.PatientCardExistsAsync(id);
            if (!patientCardExists)
                return NotFound();

            await _patientCardService.DeletePatientCardAsync(id);
            return NoContent();
        }

        // Allergy endpoints
        [HttpGet("{patientCardId}/allergies")]
        public async Task<ActionResult<IEnumerable<PatientAllergyViewModel>>> GetAllergiesByPatientCardId(int patientCardId)
        {
            var allergies = await _patientCardService.GetAllergiesByPatientCardIdAsync(patientCardId);
            var viewModels = allergies.Select(MapToViewModel).ToList();
            return Ok(viewModels);
        }

        [HttpPost("{patientCardId}/allergies")]
        public async Task<ActionResult<PatientAllergyViewModel>> AddAllergy(int patientCardId, PatientAllergyViewModel viewModel)
        {
            if (patientCardId != viewModel.PatientCardId)
                return BadRequest("Patient card ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var patientCardExists = await _patientCardService.PatientCardExistsAsync(patientCardId);
            if (!patientCardExists)
                return NotFound("Patient card not found");

            var allergy = MapToModel(viewModel);
            var createdAllergy = await _patientCardService.AddAllergyAsync(allergy);
            
            return CreatedAtAction(nameof(GetAllergiesByPatientCardId), new { patientCardId }, MapToViewModel(createdAllergy));
        }

        [HttpPut("allergies/{allergyId}")]
        public async Task<IActionResult> UpdateAllergy(int allergyId, PatientAllergyViewModel viewModel)
        {
            if (allergyId != viewModel.AllergyId)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var allergy = MapToModel(viewModel);
                await _patientCardService.UpdateAllergyAsync(allergy);
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpDelete("allergies/{allergyId}")]
        public async Task<IActionResult> DeleteAllergy(int allergyId)
        {
            try
            {
                await _patientCardService.DeleteAllergyAsync(allergyId);
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        // Chronic condition endpoints
        [HttpGet("{patientCardId}/conditions")]
        public async Task<ActionResult<IEnumerable<PatientChronicConditionViewModel>>> GetChronicConditionsByPatientCardId(int patientCardId)
        {
            var conditions = await _patientCardService.GetChronicConditionsByPatientCardIdAsync(patientCardId);
            var viewModels = conditions.Select(MapToViewModel).ToList();
            return Ok(viewModels);
        }

        [HttpPost("{patientCardId}/conditions")]
        public async Task<ActionResult<PatientChronicConditionViewModel>> AddChronicCondition(int patientCardId, PatientChronicConditionViewModel viewModel)
        {
            if (patientCardId != viewModel.PatientCardId)
                return BadRequest("Patient card ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var patientCardExists = await _patientCardService.PatientCardExistsAsync(patientCardId);
            if (!patientCardExists)
                return NotFound("Patient card not found");

            var condition = MapToModel(viewModel);
            var createdCondition = await _patientCardService.AddChronicConditionAsync(condition);
            
            return CreatedAtAction(nameof(GetChronicConditionsByPatientCardId), new { patientCardId }, MapToViewModel(createdCondition));
        }

        [HttpPut("conditions/{conditionId}")]
        public async Task<IActionResult> UpdateChronicCondition(int conditionId, PatientChronicConditionViewModel viewModel)
        {
            if (conditionId != viewModel.ConditionId)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var condition = MapToModel(viewModel);
                await _patientCardService.UpdateChronicConditionAsync(condition);
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpDelete("conditions/{conditionId}")]
        public async Task<IActionResult> DeleteChronicCondition(int conditionId)
        {
            try
            {
                await _patientCardService.DeleteChronicConditionAsync(conditionId);
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        // Immunization endpoints
        [HttpGet("{patientCardId}/immunizations")]
        public async Task<ActionResult<IEnumerable<PatientImmunizationViewModel>>> GetImmunizationsByPatientCardId(int patientCardId)
        {
            var immunizations = await _patientCardService.GetImmunizationsByPatientCardIdAsync(patientCardId);
            var viewModels = immunizations.Select(MapToViewModel).ToList();
            return Ok(viewModels);
        }

        [HttpPost("{patientCardId}/immunizations")]
        public async Task<ActionResult<PatientImmunizationViewModel>> AddImmunization(int patientCardId, PatientImmunizationViewModel viewModel)
        {
            if (patientCardId != viewModel.PatientCardId)
                return BadRequest("Patient card ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var patientCardExists = await _patientCardService.PatientCardExistsAsync(patientCardId);
            if (!patientCardExists)
                return NotFound("Patient card not found");

            var immunization = MapToModel(viewModel);
            var createdImmunization = await _patientCardService.AddImmunizationAsync(immunization);
            
            return CreatedAtAction(nameof(GetImmunizationsByPatientCardId), new { patientCardId }, MapToViewModel(createdImmunization));
        }

        [HttpPut("immunizations/{immunizationId}")]
        public async Task<IActionResult> UpdateImmunization(int immunizationId, PatientImmunizationViewModel viewModel)
        {
            if (immunizationId != viewModel.ImmunizationId)
                return BadRequest("ID mismatch");

            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            try
            {
                var immunization = MapToModel(viewModel);
                await _patientCardService.UpdateImmunizationAsync(immunization);
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        [HttpDelete("immunizations/{immunizationId}")]
        public async Task<IActionResult> DeleteImmunization(int immunizationId)
        {
            try
            {
                await _patientCardService.DeleteImmunizationAsync(immunizationId);
                return NoContent();
            }
            catch (Exception)
            {
                return NotFound();
            }
        }

        // Mapping methods
        private PatientCardViewModel MapToViewModel(PatientCard patientCard)
        {
            return new PatientCardViewModel
            {
                PatientCardId = patientCard.PatientCardId,
                FullName = patientCard.FullName,
                DateOfBirth = patientCard.DateOfBirth,
                BloodType = patientCard.BloodType?.ToString(),
                LastUpdate = patientCard.LastUpdate,
                PatientId = patientCard.PatientId,
                Allergies = patientCard.Allergies?.Select(MapToViewModel).ToList() ?? new List<PatientAllergyViewModel>(),
                ChronicConditions = patientCard.ChronicConditions?.Select(MapToViewModel).ToList() ?? new List<PatientChronicConditionViewModel>(),
                Immunizations = patientCard.Immunizations?.Select(MapToViewModel).ToList() ?? new List<PatientImmunizationViewModel>()
            };
        }

        private PatientCard MapToModel(PatientCardViewModel viewModel)
        {
            BloodType? bloodType = null;
            if (!string.IsNullOrEmpty(viewModel.BloodType) && Enum.TryParse<BloodType>(viewModel.BloodType, out var parsedBloodType))
            {
                bloodType = parsedBloodType;
            }

            return new PatientCard
            {
                PatientCardId = viewModel.PatientCardId,
                FullName = viewModel.FullName,
                DateOfBirth = viewModel.DateOfBirth,
                BloodType = bloodType,
                PatientId = viewModel.PatientId
            };
        }

        private PatientAllergyViewModel MapToViewModel(PatientAllergy allergy)
        {
            return new PatientAllergyViewModel
            {
                AllergyId = allergy.AllergyId,
                PatientCardId = allergy.PatientCardId,
                AllergyName = allergy.AllergyName,
                Severity = allergy.Severity.ToString()
            };
        }

        private PatientAllergy MapToModel(PatientAllergyViewModel viewModel)
        {
            AllergySeverity severity = AllergySeverity.Low;
            if (Enum.TryParse<AllergySeverity>(viewModel.Severity, out var parsedSeverity))
            {
                severity = parsedSeverity;
            }

            return new PatientAllergy
            {
                AllergyId = viewModel.AllergyId,
                PatientCardId = viewModel.PatientCardId,
                AllergyName = viewModel.AllergyName,
                Severity = severity
            };
        }

        private PatientChronicConditionViewModel MapToViewModel(PatientChronicCondition condition)
        {
            return new PatientChronicConditionViewModel
            {
                ConditionId = condition.ConditionId,
                PatientCardId = condition.PatientCardId,
                ConditionName = condition.ConditionName,
                DiagnosedDate = condition.DiagnosedDate
            };
        }

        private PatientChronicCondition MapToModel(PatientChronicConditionViewModel viewModel)
        {
            return new PatientChronicCondition
            {
                ConditionId = viewModel.ConditionId,
                PatientCardId = viewModel.PatientCardId,
                ConditionName = viewModel.ConditionName,
                DiagnosedDate = viewModel.DiagnosedDate
            };
        }

        private PatientImmunizationViewModel MapToViewModel(PatientImmunization immunization)
        {
            return new PatientImmunizationViewModel
            {
                ImmunizationId = immunization.ImmunizationId,
                PatientCardId = immunization.PatientCardId,
                VaccineName = immunization.VaccineName,
                VaccinationDate = immunization.VaccinationDate
            };
        }

        private PatientImmunization MapToModel(PatientImmunizationViewModel viewModel)
        {
            return new PatientImmunization
            {
                ImmunizationId = viewModel.ImmunizationId,
                PatientCardId = viewModel.PatientCardId,
                VaccineName = viewModel.VaccineName,
                VaccinationDate = viewModel.VaccinationDate
            };
        }
    }
} 