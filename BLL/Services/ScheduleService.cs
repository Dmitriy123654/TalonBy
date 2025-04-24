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
                WorkDays = settings.WorkDays.Split(',').Select(int.Parse).ToList()
            };
        }

        public async Task<ScheduleSettingsViewModel> SaveDoctorScheduleSettingsAsync(ScheduleSettingsViewModel model)
        {
            var settings = await _scheduleSettingsRepository.GetDoctorScheduleSettingsAsync(model.DoctorId);
            string workDaysString = string.Join(",", model.WorkDays);

            if (settings == null)
            {
                settings = new DoctorScheduleSettings
                {
                    DoctorId = model.DoctorId,
                    WorkdayStart = TimeSpan.Parse(model.WorkdayStart),
                    WorkdayEnd = TimeSpan.Parse(model.WorkdayEnd),
                    SlotDuration = model.SlotDuration,
                    BreakDuration = model.BreakDuration,
                    WorkDays = workDaysString
                };

                await _scheduleSettingsRepository.SaveDoctorScheduleSettingsAsync(settings);
            }
            else
            {
                settings.WorkdayStart = TimeSpan.Parse(model.WorkdayStart);
                settings.WorkdayEnd = TimeSpan.Parse(model.WorkdayEnd);
                settings.SlotDuration = model.SlotDuration;
                settings.BreakDuration = model.BreakDuration;
                settings.WorkDays = workDaysString;

                await _scheduleSettingsRepository.UpdateDoctorScheduleSettingsAsync(settings);
            }

            return model;
        }

        public async Task<bool> GenerateScheduleAsync(GenerateScheduleRequestViewModel request)
        {
            var settings = await _scheduleSettingsRepository.GetDoctorScheduleSettingsAsync(request.DoctorId);
            
            if (settings == null)
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
                if (IsWorkingDay(currentDate, settings.WorkDays))
                {
                    // Создаем временные слоты для текущего дня
                    var daySlots = GenerateDaySlots(currentDate, settings);
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
            return true;
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
                IsAvailable = ts.IsAvailable
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
                IsAvailable = timeSlot.IsAvailable
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
            // Проверяем, является ли день недели рабочим днем
            var dayOfWeek = (int)date.DayOfWeek;
            return workDays.Contains(dayOfWeek.ToString());
        }

        private List<TimeSlot> GenerateDaySlots(DateTime date, DoctorScheduleSettings settings)
        {
            var slots = new List<TimeSlot>();

            // Генерируем слоты для всего рабочего дня
            TimeSpan currentTime = settings.WorkdayStart;
            
            while (currentTime.Add(TimeSpan.FromMinutes(settings.SlotDuration)) <= settings.WorkdayEnd)
            {
                // Создаем временной слот
                var timeSlot = new TimeSlot
                {
                    DoctorId = settings.DoctorId,
                    Date = date,
                    Time = currentTime,
                    Duration = settings.SlotDuration,
                    IsAvailable = true
                };

                slots.Add(timeSlot);

                // Переходим к следующему слоту (учитывая перерыв)
                currentTime = currentTime.Add(TimeSpan.FromMinutes(settings.SlotDuration))
                    .Add(TimeSpan.FromMinutes(settings.BreakDuration));
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
                IsAvailable = slotDto.IsAvailable
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
                IsAvailable = newSlot.IsAvailable
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
    }
} 