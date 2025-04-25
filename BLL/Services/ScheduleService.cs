using Domain.Interfaces;
using Domain.Models;
using Domain.ViewModels;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BLL.Services
{
    public interface IScheduleService
    {
       // Получение настроек расписания для врача
        Task<ScheduleSettingsViewModel> GetDoctorScheduleSettingsAsync(int doctorId);

        // Сохранение настроек расписания врача
        Task<ScheduleSettingsViewModel> SaveDoctorScheduleSettingsAsync(ScheduleSettingsViewModel model);

        // Генерация расписания на основе настроек
        Task<bool> GenerateScheduleAsync(GenerateScheduleRequestViewModel request);

        // Получение временных слотов врача в указанный период
        Task<List<TimeSlotViewModel>> GetDoctorTimeSlotsAsync(int doctorId, DateTime startDate, DateTime endDate);

        // Обновление доступности временного слота
        Task<TimeSlotViewModel> UpdateTimeSlotAsync(int slotId, UpdateSlotViewModel model);

        // Получение расписания врача с временными слотами
        Task<DoctorScheduleViewModel> GetDoctorScheduleWithTimeSlotsAsync(int doctorId, DateTime startDate, DateTime endDate);

        // Создание нового временного слота
        Task<TimeSlotViewModel> CreateTimeSlotAsync(TimeSlotViewModel slotDto);

        // Удаление временного слота
        Task DeleteTimeSlotAsync(int slotId);

        // Обновление группы слотов для конкретного дня
        Task<bool> UpdateDayScheduleAsync(int doctorId, DateTime date, List<UpdateSlotViewModel> slotsToUpdate);

        // Автоматическая генерация расписания по шаблону
        Task<DoctorScheduleViewModel> GenerateAutomaticScheduleAsync(int doctorId, DateTime startDate, DateTime endDate, ScheduleSettingsViewModel settings);
        
        // Удаление расписания для указанного врача и периода
        Task<bool> DeleteScheduleAsync(int doctorId, DateTime startDate, DateTime endDate);
    }

    public class ScheduleService : IScheduleService
    {
        private readonly ITimeSlotRepository _timeSlotRepository;
        private readonly IDoctorScheduleSettingsRepository _scheduleSettingsRepository;
        private readonly IDoctorRepository _doctorRepository;

        public ScheduleService(
            ITimeSlotRepository timeSlotRepository,
            IDoctorScheduleSettingsRepository scheduleSettingsRepository,
            IDoctorRepository doctorRepository)
        {
            _timeSlotRepository = timeSlotRepository;
            _scheduleSettingsRepository = scheduleSettingsRepository;
            _doctorRepository = doctorRepository;
        }

        public async Task<ScheduleSettingsViewModel> GetDoctorScheduleSettingsAsync(int doctorId)
        {
            var settings = await _scheduleSettingsRepository.GetDoctorScheduleSettingsAsync(doctorId);
            
            if (settings == null)
            {
                return null;
            }

            return new ScheduleSettingsViewModel
            {
                DoctorId = settings.DoctorId,
                WorkdayStart = settings.WorkdayStart.ToString(@"hh\:mm"),
                WorkdayEnd = settings.WorkdayEnd.ToString(@"hh\:mm"),
                SlotDuration = settings.SlotDuration,
                BreakDuration = settings.BreakDuration,
                WorkDays = settings.WorkDays,
                LunchBreak = settings.LunchBreak,
                LunchStart = settings.LunchStart?.ToString(@"hh\:mm"),
                LunchEnd = settings.LunchEnd?.ToString(@"hh\:mm"),
                HospitalId = settings.HospitalId
            };
        }

        public async Task<ScheduleSettingsViewModel> SaveDoctorScheduleSettingsAsync(ScheduleSettingsViewModel model)
        {
            var settings = await _scheduleSettingsRepository.GetDoctorScheduleSettingsAsync(model.DoctorId);

            if (settings == null)
            {
                settings = new DoctorScheduleSettings
                {
                    DoctorId = model.DoctorId,
                    WorkdayStart = TimeSpan.Parse(model.WorkdayStart),
                    WorkdayEnd = TimeSpan.Parse(model.WorkdayEnd),
                    SlotDuration = model.SlotDuration,
                    BreakDuration = model.BreakDuration,
                    WorkDays = model.WorkDays,
                    LunchBreak = model.LunchBreak,
                    HospitalId = model.HospitalId
                };

                if (model.LunchBreak && !string.IsNullOrEmpty(model.LunchStart) && !string.IsNullOrEmpty(model.LunchEnd))
                {
                    settings.LunchStart = TimeSpan.Parse(model.LunchStart);
                    settings.LunchEnd = TimeSpan.Parse(model.LunchEnd);
                }

                await _scheduleSettingsRepository.SaveDoctorScheduleSettingsAsync(settings);
            }
            else
            {
                settings.WorkdayStart = TimeSpan.Parse(model.WorkdayStart);
                settings.WorkdayEnd = TimeSpan.Parse(model.WorkdayEnd);
                settings.SlotDuration = model.SlotDuration;
                settings.BreakDuration = model.BreakDuration;
                settings.WorkDays = model.WorkDays;
                settings.LunchBreak = model.LunchBreak;
                settings.HospitalId = model.HospitalId;

                if (model.LunchBreak && !string.IsNullOrEmpty(model.LunchStart) && !string.IsNullOrEmpty(model.LunchEnd))
                {
                    settings.LunchStart = TimeSpan.Parse(model.LunchStart);
                    settings.LunchEnd = TimeSpan.Parse(model.LunchEnd);
                }
                else
                {
                    settings.LunchStart = null;
                    settings.LunchEnd = null;
                }

                await _scheduleSettingsRepository.UpdateDoctorScheduleSettingsAsync(settings);
            }

            return model;
        }

        public async Task<bool> GenerateScheduleAsync(GenerateScheduleRequestViewModel request)
        {
            // Если передали новые настройки, сначала сохраним их
            if (request.Settings != null)
            {
                await SaveDoctorScheduleSettingsAsync(request.Settings);
                // После сохранения, получим настройки из базы
                var settings = await _scheduleSettingsRepository.GetDoctorScheduleSettingsAsync(request.DoctorId);
                
                if (settings == null)
                {
                    // Если по какой-то причине настройки не сохранились, создадим их сейчас
                    settings = new DoctorScheduleSettings
                    {
                        DoctorId = request.DoctorId,
                        WorkdayStart = TimeSpan.Parse(request.Settings.WorkdayStart),
                        WorkdayEnd = TimeSpan.Parse(request.Settings.WorkdayEnd),
                        SlotDuration = request.Settings.SlotDuration,
                        BreakDuration = request.Settings.BreakDuration,
                        WorkDays = request.Settings.WorkDays,
                        LunchBreak = request.Settings.LunchBreak,
                        HospitalId = request.Settings.HospitalId
                    };

                    if (request.Settings.LunchBreak && !string.IsNullOrEmpty(request.Settings.LunchStart) && !string.IsNullOrEmpty(request.Settings.LunchEnd))
                    {
                        settings.LunchStart = TimeSpan.Parse(request.Settings.LunchStart);
                        settings.LunchEnd = TimeSpan.Parse(request.Settings.LunchEnd);
                    }

                    await _scheduleSettingsRepository.SaveDoctorScheduleSettingsAsync(settings);
                }
            }

            // Затем используем сохраненные настройки для генерации
            var savedSettings = await _scheduleSettingsRepository.GetDoctorScheduleSettingsAsync(request.DoctorId);
            
            if (savedSettings == null && request.Settings != null)
            {
                // Используем настройки из запроса, если сохраненных нет
                savedSettings = new DoctorScheduleSettings
                {
                    DoctorId = request.DoctorId,
                    WorkdayStart = TimeSpan.Parse(request.Settings.WorkdayStart),
                    WorkdayEnd = TimeSpan.Parse(request.Settings.WorkdayEnd),
                    SlotDuration = request.Settings.SlotDuration,
                    BreakDuration = request.Settings.BreakDuration,
                    WorkDays = request.Settings.WorkDays,
                    LunchBreak = request.Settings.LunchBreak,
                    HospitalId = request.Settings.HospitalId
                };

                if (request.Settings.LunchBreak && !string.IsNullOrEmpty(request.Settings.LunchStart) && !string.IsNullOrEmpty(request.Settings.LunchEnd))
                {
                    savedSettings.LunchStart = TimeSpan.Parse(request.Settings.LunchStart);
                    savedSettings.LunchEnd = TimeSpan.Parse(request.Settings.LunchEnd);
                }
            }
            else if (savedSettings == null && request.Settings == null)
            {
                throw new InvalidOperationException("Настройки расписания врача не найдены");
            }

            // Удаляем существующие слоты в указанном диапазоне
            await _timeSlotRepository.DeleteTimeSlotsForPeriodAsync(request.DoctorId, request.StartDate, request.EndDate);

            var currentDate = request.StartDate.Date;
            var endDate = request.EndDate.Date;
            var generatedSlots = new List<TimeSlot>();

            while (currentDate <= endDate)
            {
                // Проверяем, является ли день рабочим для врача
                if (IsWorkingDay(currentDate, savedSettings.WorkDays))
                {
                    // Создаем временные слоты для текущего дня
                    var daySlots = GenerateDaySlots(currentDate, savedSettings);
                    generatedSlots.AddRange(daySlots);
                }

                currentDate = currentDate.AddDays(1);
            }

            // Сохраняем сгенерированные слоты
            foreach (var slot in generatedSlots)
            {
                await _timeSlotRepository.CreateTimeSlotAsync(slot);
            }

            // Возвращаем сгенерированное расписание
            return generatedSlots.Count > 0;
        }

        public async Task<List<TimeSlotViewModel>> GetDoctorTimeSlotsAsync(int doctorId, DateTime startDate, DateTime endDate)
        {
            var timeSlots = await _timeSlotRepository.GetDoctorTimeSlotsAsync(doctorId, startDate, endDate);
            
            return timeSlots.Select(ts => new TimeSlotViewModel
            {
                Id = ts.TimeSlotId,
                DoctorId = ts.DoctorId,
                Date = ts.Date.ToString("yyyy-MM-dd"),
                Time = ts.Time.ToString(@"hh\:mm"),
                Duration = ts.Duration,
                IsAvailable = ts.IsAvailable,
                HospitalId = ts.HospitalId
            }).ToList();
        }

        public async Task<TimeSlotViewModel> UpdateTimeSlotAsync(int slotId, UpdateSlotViewModel model)
        {
            var timeSlot = await _timeSlotRepository.GetTimeSlotByIdAsync(slotId);
            
            if (timeSlot == null)
            {
                throw new KeyNotFoundException($"Временной слот с ID {slotId} не найден");
            }

            timeSlot.IsAvailable = model.IsAvailable;
            await _timeSlotRepository.UpdateTimeSlotAsync(timeSlot);

            return new TimeSlotViewModel
            {
                Id = timeSlot.TimeSlotId,
                DoctorId = timeSlot.DoctorId,
                Date = timeSlot.Date.ToString("yyyy-MM-dd"),
                Time = timeSlot.Time.ToString(@"hh\:mm"),
                Duration = timeSlot.Duration,
                IsAvailable = timeSlot.IsAvailable,
                HospitalId = timeSlot.HospitalId
            };
        }

        public async Task<DoctorScheduleViewModel> GetDoctorScheduleWithTimeSlotsAsync(int doctorId, DateTime startDate, DateTime endDate)
        {
            var doctor = await _doctorRepository.GetByIdAsync(doctorId);
            
            if (doctor == null)
            {
                throw new KeyNotFoundException($"Врач с ID {doctorId} не найден");
            }

            var timeSlots = await GetDoctorTimeSlotsAsync(doctorId, startDate, endDate);
            var settings = await GetDoctorScheduleSettingsAsync(doctorId);

            // Группируем слоты по датам
            var schedule = timeSlots
                .GroupBy(s => s.Date)
                .ToDictionary(
                    g => g.Key, 
                    g => g.ToList()
                );

            return new DoctorScheduleViewModel
            {
                DoctorId = doctor.DoctorId,
                DoctorName = doctor.FullName,
                Specialization = doctor.DoctorsSpeciality?.Name,
                Schedule = schedule
            };
        }

        // Вспомогательные методы
        private bool IsWorkingDay(DateTime date, string workDays)
        {
            if (string.IsNullOrEmpty(workDays))
                return false;

            // Получаем день недели (0 - воскресенье, 1 - понедельник и т.д. по стандарту .NET)
            int dayOfWeek = (int)date.DayOfWeek;
            
            // Разбиваем строку рабочих дней на массив
            var workingDays = workDays.Split(',')
                .Select(d => d.Trim())
                .Where(d => !string.IsNullOrEmpty(d))
                .Select(int.Parse)
                .ToList();
            
            // Проверяем, входит ли текущий день недели в список рабочих дней
            return workingDays.Contains(dayOfWeek);
        }

        private List<TimeSlot> GenerateDaySlots(DateTime date, DoctorScheduleSettings settings)
        {
            var slots = new List<TimeSlot>();

            // Генерируем слоты для всего рабочего дня
            TimeSpan currentTime = settings.WorkdayStart;
            
            while (currentTime.Add(TimeSpan.FromMinutes(settings.SlotDuration)) <= settings.WorkdayEnd)
            {
                // Проверяем, не попадает ли слот на обеденный перерыв
                bool isLunchTime = false;
                
                if (settings.LunchBreak && settings.LunchStart.HasValue && settings.LunchEnd.HasValue)
                {
                    // Проверка на обеденный перерыв
                    isLunchTime = (currentTime >= settings.LunchStart.Value && 
                                   currentTime < settings.LunchEnd.Value) ||
                                  (currentTime.Add(TimeSpan.FromMinutes(settings.SlotDuration)) > settings.LunchStart.Value && 
                                   currentTime < settings.LunchEnd.Value);
                }

                if (!isLunchTime)
                {
                    // Создаем временной слот
                    var timeSlot = new TimeSlot
                    {
                        DoctorId = settings.DoctorId,
                        Date = date,
                        Time = currentTime,
                        Duration = settings.SlotDuration,
                        IsAvailable = true,
                        HospitalId = settings.HospitalId
                    };

                    slots.Add(timeSlot);
                }

                // Переходим к следующему слоту (учитывая перерыв)
                currentTime = currentTime.Add(TimeSpan.FromMinutes(settings.SlotDuration))
                    .Add(TimeSpan.FromMinutes(settings.BreakDuration));
                
                // Если мы в обеденном перерыве, пропускаем его
                if (settings.LunchBreak && settings.LunchStart.HasValue && settings.LunchEnd.HasValue && 
                    currentTime >= settings.LunchStart.Value && currentTime < settings.LunchEnd.Value)
                {
                    currentTime = settings.LunchEnd.Value;
                }
            }

            return slots;
        }

        public async Task<TimeSlotViewModel> CreateTimeSlotAsync(TimeSlotViewModel slotDto)
        {
            // Преобразуем строку даты в DateTime
            var date = DateTime.Parse(slotDto.Date);
            
            // Преобразуем строку времени в TimeSpan
            var time = TimeSpan.Parse(slotDto.Time);

            // Проверяем, существует ли уже временной слот на это время
            var existingSlot = await _timeSlotRepository.GetTimeSlotAsync(slotDto.DoctorId, date, time);

            if (existingSlot != null)
            {
                throw new Exception("Временной слот на это время уже существует");
            }

            // Создаем новый временной слот
            var newSlot = new TimeSlot
            {
                DoctorId = slotDto.DoctorId,
                Date = date,
                Time = time,
                Duration = slotDto.Duration,
                IsAvailable = slotDto.IsAvailable,
                HospitalId = slotDto.HospitalId
            };

            await _timeSlotRepository.CreateTimeSlotAsync(newSlot);

            // Возвращаем созданный слот в виде DTO
            return new TimeSlotViewModel
            {
                Id = newSlot.TimeSlotId,
                DoctorId = newSlot.DoctorId,
                Date = newSlot.Date.ToString("yyyy-MM-dd"),
                Time = newSlot.Time.ToString(@"hh\:mm"),
                Duration = newSlot.Duration,
                IsAvailable = newSlot.IsAvailable,
                HospitalId = newSlot.HospitalId
            };
        }

        public async Task DeleteTimeSlotAsync(int slotId)
        {
            var timeSlot = await _timeSlotRepository.GetTimeSlotByIdAsync(slotId);
            
            if (timeSlot == null)
            {
                throw new KeyNotFoundException($"Временной слот с ID {slotId} не найден");
            }

            await _timeSlotRepository.DeleteTimeSlotAsync(slotId);
        }

        // Обновление группы слотов для конкретного дня
        public async Task<bool> UpdateDayScheduleAsync(int doctorId, DateTime date, List<UpdateSlotViewModel> slotsToUpdate)
        {
            if (slotsToUpdate == null || !slotsToUpdate.Any())
            {
                return false;
            }

            // Получаем все слоты на указанную дату
            var existingSlots = await _timeSlotRepository.GetTimeSlotsForDateAsync(doctorId, date);
            
            if (existingSlots == null || !existingSlots.Any())
            {
                throw new KeyNotFoundException($"Слоты для врача с ID {doctorId} на дату {date:yyyy-MM-dd} не найдены");
            }

            // Обновляем доступность для каждого слота
            foreach (var slotUpdate in slotsToUpdate)
            {
                if (slotUpdate.SlotId <= 0) continue;

                var slot = existingSlots.FirstOrDefault(s => s.TimeSlotId == slotUpdate.SlotId);
                if (slot != null)
                {
                    slot.IsAvailable = slotUpdate.IsAvailable;
                    await _timeSlotRepository.UpdateTimeSlotAsync(slot);
                }
            }

            return true;
        }

        // Автоматическая генерация расписания по шаблону
        public async Task<DoctorScheduleViewModel> GenerateAutomaticScheduleAsync(int doctorId, DateTime startDate, DateTime endDate, ScheduleSettingsViewModel settings)
        {
            if (settings == null)
            {
                throw new ArgumentNullException(nameof(settings), "Настройки расписания не могут быть пустыми");
            }

            // Сначала сохраняем настройки
            await SaveDoctorScheduleSettingsAsync(settings);

            // Создаем запрос на генерацию расписания
            var request = new GenerateScheduleRequestViewModel
            {
                DoctorId = doctorId,
                StartDate = startDate,
                EndDate = endDate
            };

            // Генерируем расписание
            var success = await GenerateScheduleAsync(request);
            if (!success)
            {
                throw new InvalidOperationException("Не удалось сгенерировать расписание автоматически");
            }

            // Возвращаем сгенерированное расписание
            return await GetDoctorScheduleWithTimeSlotsAsync(doctorId, startDate, endDate);
        }

        public async Task<bool> DeleteScheduleAsync(int doctorId, DateTime startDate, DateTime endDate)
        {
            // Вызываем метод репозитория для удаления слотов за указанный период
            return await _timeSlotRepository.DeleteTimeSlotsForPeriodAsync(doctorId, startDate, endDate);
        }
    }
} 