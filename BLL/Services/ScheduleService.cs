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
        
        // Автоматическая генерация расписания для разных областей (больницы, специальности, врачи)
        Task<object> AutoGenerateScheduleAsync(AutoGenerateScheduleRequestViewModel request);

        // Новые методы для периодической автоматической генерации
        
        // Сохранение настроек автоматической генерации
        Task<AutoGenerationSettingsViewModel> SaveAutoGenerationSettingsAsync(AutoGenerationSettingsViewModel model);
        
        // Получение настроек автоматической генерации для конкретного врача
        Task<AutoGenerationSettingsViewModel> GetAutoGenerationSettingsForDoctorAsync(int doctorId);
        
        // Отключение автоматической генерации
        Task<bool> DisableAutoGenerationAsync(int settingsId);
        
        // Получение всех активных настроек автоматической генерации
        Task<List<AutoGenerationSettingsViewModel>> GetAllActiveAutoGenerationSettingsAsync();
        
        // Выполнение запланированных генераций
        Task<int> ProcessDueGenerationsAsync();
    }

    public class ScheduleService : IScheduleService
    {
        private readonly ITimeSlotRepository _timeSlotRepository;
        private readonly IDoctorScheduleSettingsRepository _scheduleSettingsRepository;
        private readonly IDoctorRepository _doctorRepository;
        private readonly IAutoGenerationSettingsRepository _autoGenerationSettingsRepository;

        public ScheduleService(
            ITimeSlotRepository timeSlotRepository,
            IDoctorScheduleSettingsRepository scheduleSettingsRepository,
            IDoctorRepository doctorRepository,
            IAutoGenerationSettingsRepository autoGenerationSettingsRepository)
        {
            _timeSlotRepository = timeSlotRepository;
            _scheduleSettingsRepository = scheduleSettingsRepository;
            _doctorRepository = doctorRepository;
            _autoGenerationSettingsRepository = autoGenerationSettingsRepository;
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
            if (model == null)
            {
                throw new ArgumentNullException(nameof(model));
            }

            if (model.DoctorId <= 0)
            {
                throw new ArgumentException("ID врача не может быть равен 0 или отрицательным", nameof(model.DoctorId));
            }
            
            // Проверка существования врача
            var doctor = await _doctorRepository.GetByIdAsync(model.DoctorId);
            if (doctor == null)
            {
                throw new InvalidOperationException($"Врач с ID {model.DoctorId} не найден");
            }

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
            // Проверяем существование врача
            var doctor = await _doctorRepository.GetByIdAsync(request.DoctorId);
            if (doctor == null)
            {
                throw new InvalidOperationException($"Врач с ID {request.DoctorId} не найден");
            }
            
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

            try
            {
                // Проверяем, нужно ли очистить существующее расписание
                if (request.ClearExistingSchedule)
                {
            await _timeSlotRepository.DeleteTimeSlotsForPeriodAsync(request.DoctorId, request.StartDate, request.EndDate);
                    Console.WriteLine($"Очищено расписание для врача {doctor.FullName} за период {request.StartDate:yyyy-MM-dd} - {request.EndDate:yyyy-MM-dd}");
                }
                // Если флаг не установлен, проверим наличие слотов
                else
                {
                    var existingSlots = await _timeSlotRepository.GetDoctorTimeSlotsAsync(request.DoctorId, request.StartDate, request.EndDate);
                    if (existingSlots.Any())
                    {
                        // Удаляем существующие слоты, чтобы не было конфликтов
                        await _timeSlotRepository.DeleteTimeSlotsForPeriodAsync(request.DoctorId, request.StartDate, request.EndDate);
                        Console.WriteLine($"Найдено и удалено {existingSlots.Count} существующих слотов для врача {doctor.FullName}");
                    }
                }

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
                int successCount = 0;
            foreach (var slot in generatedSlots)
                {
                    try
            {
                await _timeSlotRepository.CreateTimeSlotAsync(slot);
                        successCount++;
                    }
                    catch (Exception ex)
                    {
                        Console.Error.WriteLine($"Ошибка при сохранении слота для врача {request.DoctorId}: {ex.Message}");
                        // Продолжаем с другими слотами
                    }
                }
                
                Console.WriteLine($"Расписание для врача {doctor.FullName} сгенерировано: {successCount} из {generatedSlots.Count} слотов");

                return successCount > 0; // Возвращаем true, если хотя бы один слот был создан
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Ошибка при генерации расписания для врача {request.DoctorId}: {ex.Message}");
                return false;
            }
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

        // Автоматическая генерация расписания для разных областей (больницы, специальности, врачи)
        public async Task<object> AutoGenerateScheduleAsync(AutoGenerateScheduleRequestViewModel request)
        {
            if (request == null)
            {
                throw new ArgumentNullException(nameof(request), "Запрос не может быть пустым");
            }

            if (request.Settings == null)
            {
                throw new ArgumentNullException(nameof(request.Settings), "Настройки расписания не могут быть пустыми");
            }

            if (string.IsNullOrEmpty(request.Scope))
            {
                throw new ArgumentException("Необходимо указать область применения", nameof(request.Scope));
            }

            var results = new Dictionary<string, object>();
            var successCount = 0;
            var totalCount = 0;
            var doctorNames = new List<string>(); // Список имен врачей, для которых создано расписание

            // Проверка и обработка параметров для разных областей применения 
            switch (request.Scope.ToLower())
            {
                case "allhospitals":
                    // Получить всех врачей из всех больниц
                    var allDoctors = await _doctorRepository.GetAllAsync();
                    totalCount = allDoctors.Count;
                    
                    // Проверяем список врачей
                    if (allDoctors == null || allDoctors.Count == 0)
                    {
                        throw new InvalidOperationException("Не найдено ни одного врача во всех больницах");
                    }
                    
                    // Генерируем расписание для каждого врача
                    foreach (var doctorItem in allDoctors)
                    {
                        if (doctorItem.DoctorId <= 0)
                        {
                            continue; // Пропускаем некорректные ID
                        }

                        try
                        {
                            // Используем отдельную настройку расписания для каждого врача
                            // Копируем настройки из шаблона, но обновляем DoctorId
                            var individualSettings = new ScheduleSettingsViewModel
                            {
                                DoctorId = doctorItem.DoctorId,
                                HospitalId = doctorItem.HospitalId,
                                WorkdayStart = request.Settings.WorkdayStart,
                                WorkdayEnd = request.Settings.WorkdayEnd,
                                SlotDuration = request.Settings.SlotDuration,
                                BreakDuration = request.Settings.BreakDuration,
                                WorkDays = request.Settings.WorkDays,
                                LunchBreak = request.Settings.LunchBreak,
                                LunchStart = request.Settings.LunchStart,
                                LunchEnd = request.Settings.LunchEnd
                            };
                            
                            bool result = await GenerateScheduleForSingleDoctor(
                                doctorItem.DoctorId, 
                                request.StartDate, 
                                request.EndDate, 
                                individualSettings,
                                request.ClearExistingSchedule);
                            
                            if (result)
                            {
                                successCount++;
                                doctorNames.Add(doctorItem.FullName);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Логируем ошибку, но продолжаем с другими врачами
                            Console.Error.WriteLine($"Ошибка при генерации расписания для врача {doctorItem.DoctorId}: {ex.Message}");
                        }
                    }
                    break;
                    
                case "selectedhospital":
                    if (!request.HospitalId.HasValue || request.HospitalId.Value <= 0)
                    {
                        throw new ArgumentException("Для области 'selectedHospital' необходимо указать ID больницы", nameof(request.HospitalId));
                    }

                    // Получить всех врачей из выбранной больницы
                    var hospitalDoctors = _doctorRepository.GetByHospitalId(request.HospitalId.Value).ToList();
                    totalCount = hospitalDoctors.Count;
                    
                    // Проверяем список врачей
                    if (hospitalDoctors == null || hospitalDoctors.Count == 0)
                    {
                        throw new InvalidOperationException($"Не найдено ни одного врача в больнице с ID {request.HospitalId.Value}");
                    }
                    
                    // Генерируем расписание для каждого врача больницы
                    foreach (var hospitalDoctor in hospitalDoctors)
                    {
                        if (hospitalDoctor.DoctorId <= 0)
                        {
                            continue; // Пропускаем некорректные ID
                        }

                        try
                        {
                            // Используем отдельную настройку расписания для каждого врача
                            var individualSettings = new ScheduleSettingsViewModel
                            {
                                DoctorId = hospitalDoctor.DoctorId,
                                HospitalId = request.HospitalId.Value,
                                WorkdayStart = request.Settings.WorkdayStart,
                                WorkdayEnd = request.Settings.WorkdayEnd,
                                SlotDuration = request.Settings.SlotDuration,
                                BreakDuration = request.Settings.BreakDuration,
                                WorkDays = request.Settings.WorkDays,
                                LunchBreak = request.Settings.LunchBreak,
                                LunchStart = request.Settings.LunchStart,
                                LunchEnd = request.Settings.LunchEnd
                            };
                            
                            bool result = await GenerateScheduleForSingleDoctor(
                                hospitalDoctor.DoctorId, 
                                request.StartDate, 
                                request.EndDate, 
                                individualSettings,
                                request.ClearExistingSchedule);
                            
                            if (result)
                            {
                                successCount++;
                                doctorNames.Add(hospitalDoctor.FullName);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Логируем ошибку, но продолжаем с другими врачами
                            Console.Error.WriteLine($"Ошибка при генерации расписания для врача {hospitalDoctor.DoctorId}: {ex.Message}");
                        }
                    }
                    break;
                    
                case "selectedspeciality":
                    if (!request.HospitalId.HasValue || request.HospitalId.Value <= 0)
                    {
                        throw new ArgumentException("Для области 'selectedSpeciality' необходимо указать ID больницы", nameof(request.HospitalId));
                    }
                    
                    if (!request.SpecialityId.HasValue || request.SpecialityId.Value <= 0)
                    {
                        throw new ArgumentException("Для области 'selectedSpeciality' необходимо указать ID специальности", nameof(request.SpecialityId));
                    }

                    // Получить всех врачей выбранной специальности и больницы
                    var specialityDoctors = _doctorRepository.GetBySpecialtyAndHospitalId(
                        request.HospitalId.Value, 
                        request.SpecialityId.Value
                    ).ToList();
                    totalCount = specialityDoctors.Count;
                    
                    // Проверяем список врачей
                    if (specialityDoctors == null || specialityDoctors.Count == 0)
                    {
                        throw new InvalidOperationException($"Не найдено ни одного врача специальности {request.SpecialityId.Value} в больнице {request.HospitalId.Value}");
                    }
                    
                    // Генерируем расписание для каждого врача выбранной специальности
                    foreach (var specialityDoctor in specialityDoctors)
                    {
                        if (specialityDoctor.DoctorId <= 0)
                        {
                            continue; // Пропускаем некорректные ID
                        }

                        try
                        {
                            // Используем отдельную настройку расписания для каждого врача
                            var individualSettings = new ScheduleSettingsViewModel
                            {
                                DoctorId = specialityDoctor.DoctorId,
                                HospitalId = request.HospitalId.Value,
                                WorkdayStart = request.Settings.WorkdayStart,
                                WorkdayEnd = request.Settings.WorkdayEnd,
                                SlotDuration = request.Settings.SlotDuration,
                                BreakDuration = request.Settings.BreakDuration,
                                WorkDays = request.Settings.WorkDays,
                                LunchBreak = request.Settings.LunchBreak,
                                LunchStart = request.Settings.LunchStart,
                                LunchEnd = request.Settings.LunchEnd
                            };
                            
                            bool result = await GenerateScheduleForSingleDoctor(
                                specialityDoctor.DoctorId, 
                                request.StartDate, 
                                request.EndDate, 
                                individualSettings,
                                request.ClearExistingSchedule);
                            
                            if (result)
                            {
                                successCount++;
                                doctorNames.Add(specialityDoctor.FullName);
                            }
                        }
                        catch (Exception ex)
                        {
                            // Логируем ошибку, но продолжаем с другими врачами
                            Console.Error.WriteLine($"Ошибка при генерации расписания для врача {specialityDoctor.DoctorId}: {ex.Message}");
                        }
                    }
                    break;
                    
                case "selecteddoctor":
                    if (!request.DoctorId.HasValue)
                    {
                        throw new ArgumentException("Для области 'selectedDoctor' необходимо указать ID врача", nameof(request.DoctorId));
                    }

                    // Проверяем существование врача
                    var selectedDoctor = await _doctorRepository.GetByIdAsync(request.DoctorId.Value);
                    if (selectedDoctor == null)
                    {
                        throw new InvalidOperationException($"Врач с ID {request.DoctorId.Value} не найден");
                    }
                    
                    // Для одного врача
                    totalCount = 1;
                    try
                    {
                        // Убеждаемся, что ID врача указан правильно в настройках
                        var individualSettings = new ScheduleSettingsViewModel
                        {
                            DoctorId = request.DoctorId.Value,
                            HospitalId = selectedDoctor.HospitalId,
                            WorkdayStart = request.Settings.WorkdayStart,
                            WorkdayEnd = request.Settings.WorkdayEnd,
                            SlotDuration = request.Settings.SlotDuration,
                            BreakDuration = request.Settings.BreakDuration,
                            WorkDays = request.Settings.WorkDays,
                            LunchBreak = request.Settings.LunchBreak,
                            LunchStart = request.Settings.LunchStart,
                            LunchEnd = request.Settings.LunchEnd
                        };
                        
                        bool result = await GenerateScheduleForSingleDoctor(
                            request.DoctorId.Value, 
                            request.StartDate, 
                            request.EndDate, 
                            individualSettings,
                            request.ClearExistingSchedule);
                        
                        if (result)
                        {
                            successCount++;
                            doctorNames.Add(selectedDoctor.FullName);
                        }
                    }
                    catch (Exception ex)
                    {
                        // Логируем ошибку для выбранного врача
                        Console.Error.WriteLine($"Ошибка при генерации расписания для врача {request.DoctorId.Value}: {ex.Message}");
                    }
                    break;
                    
                default:
                    throw new ArgumentException($"Неизвестная область применения '{request.Scope}'", nameof(request.Scope));
            }

            // Формируем результат
            results.Add("totalCount", totalCount);
            results.Add("successCount", successCount);
            results.Add("scope", request.Scope);
            results.Add("startDate", request.StartDate.ToString("yyyy-MM-dd"));
            results.Add("endDate", request.EndDate.ToString("yyyy-MM-dd"));
            
            // Добавляем список врачей, для которых создано расписание
            if (doctorNames.Count > 0)
            {
                results.Add("doctorNames", doctorNames);
            }
            
            return results;
        }

        // Вспомогательный метод для генерации расписания для одного врача
        private async Task<bool> GenerateScheduleForSingleDoctor(int doctorId, DateTime startDate, DateTime endDate, ScheduleSettingsViewModel settings, bool clearExistingSchedule = false)
        {
            try
            {
                // Проверяем существование врача
                var doctor = await _doctorRepository.GetByIdAsync(doctorId);
                if (doctor == null)
                {
                    return false;
                }

                // Если нужно очистить существующее расписание
                if (clearExistingSchedule)
                {
                    // Сначала проверяем, есть ли слоты для удаления
                    var existingSlots = await _timeSlotRepository.GetDoctorTimeSlotsAsync(doctorId, startDate, endDate);
                    if (existingSlots != null && existingSlots.Any())
                    {
                        // Удаляем только если есть что удалять
                        await _timeSlotRepository.DeleteDoctorTimeSlotsAsync(doctorId, startDate, endDate);
                    }
                }

                // Получаем настройки из базы или используем переданные
                DoctorScheduleSettings dbSettings = null;
                
                if (settings != null)
                {
                    // Используем переданные настройки
                    dbSettings = new DoctorScheduleSettings
                    {
                        DoctorId = doctorId,
                        WorkdayStart = TimeSpan.Parse(settings.WorkdayStart),
                        WorkdayEnd = TimeSpan.Parse(settings.WorkdayEnd),
                        SlotDuration = settings.SlotDuration,
                        BreakDuration = settings.BreakDuration,
                        WorkDays = settings.WorkDays,
                        LunchBreak = settings.LunchBreak,
                        HospitalId = settings.HospitalId
                    };

                    if (settings.LunchBreak && !string.IsNullOrEmpty(settings.LunchStart) && !string.IsNullOrEmpty(settings.LunchEnd))
                    {
                        dbSettings.LunchStart = TimeSpan.Parse(settings.LunchStart);
                        dbSettings.LunchEnd = TimeSpan.Parse(settings.LunchEnd);
                    }
                }
                else
                {
                    // Если настройки не переданы, ищем их в базе
                    dbSettings = await _scheduleSettingsRepository.GetDoctorScheduleSettingsAsync(doctorId);
                    if (dbSettings == null)
                    {
                        return false;
                    }
                }

                // Генерация слотов для каждого дня в диапазоне
                List<TimeSlot> allSlots = new List<TimeSlot>();
                
                for (DateTime date = startDate.Date; date <= endDate.Date; date = date.AddDays(1))
                {
                    if (IsWorkingDay(date, dbSettings.WorkDays))
                    {
                        var daySlots = GenerateDaySlots(date, dbSettings);
                        if (daySlots.Any())
                        {
                            allSlots.AddRange(daySlots);
                        }
                    }
                }

                // Сохраняем все слоты разом
                if (allSlots.Any())
                {
                    await _timeSlotRepository.SaveRangeAsync(allSlots);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Ошибка при генерации расписания для врача {doctorId}: {ex.Message}");
                return false;
            }
        }

        // Новые методы для периодической автоматической генерации
        
        // Сохранение настроек автоматической генерации
        public async Task<AutoGenerationSettingsViewModel> SaveAutoGenerationSettingsAsync(AutoGenerationSettingsViewModel model)
        {
            if (model == null)
            {
                throw new ArgumentNullException(nameof(model), "Настройки автоматической генерации не могут быть пустыми");
            }
            
            if (model.ScheduleSettings == null)
            {
                throw new ArgumentNullException(nameof(model.ScheduleSettings), "Настройки расписания не могут быть пустыми");
            }
            
            // Проверяем, что DoctorId в настройках расписания не равен 0
            if (model.ScheduleSettings.DoctorId <= 0 && (model.Scope == "selectedDoctor" || model.DoctorId.HasValue))
            {
                // Если выбран конкретный врач, обновим ID в настройках
                if (model.Scope == "selectedDoctor" && model.DoctorId.HasValue && model.DoctorId.Value > 0)
                {
                    model.ScheduleSettings.DoctorId = model.DoctorId.Value;
                }
                else
                {
                    throw new ArgumentException("ID врача в настройках расписания не может быть равен 0", nameof(model.ScheduleSettings.DoctorId));
                }
            }

            var autoGenSettings = model.AutoGenerationSettingsId.HasValue ? 
                await _autoGenerationSettingsRepository.GetByIdAsync(model.AutoGenerationSettingsId.Value) : null;

            if (autoGenSettings == null)
            {
                // Создаем новую запись
                autoGenSettings = new AutoGenerationSettings
                {
                    IsEnabled = model.IsEnabled,
                    Scope = model.Scope,
                    PeriodType = model.PeriodType,
                    NextGenerationDate = model.NextGenerationDate,
                    HospitalId = model.HospitalId,
                    SpecialityId = model.SpecialityId,
                    DoctorId = model.DoctorId,
                    CreatedByUserId = model.ScheduleSettings.DoctorId, // Используем ID доктора как ID пользователя (можно заменить на другое)
                    CreatedDate = DateTime.UtcNow,
                    ScheduleSettingsJson = System.Text.Json.JsonSerializer.Serialize(model.ScheduleSettings)
                };

                autoGenSettings = await _autoGenerationSettingsRepository.CreateAsync(autoGenSettings);
            }
            else
            {
                // Обновляем существующую запись
                autoGenSettings.IsEnabled = model.IsEnabled;
                autoGenSettings.Scope = model.Scope;
                autoGenSettings.PeriodType = model.PeriodType;
                autoGenSettings.NextGenerationDate = model.NextGenerationDate;
                autoGenSettings.HospitalId = model.HospitalId;
                autoGenSettings.SpecialityId = model.SpecialityId;
                autoGenSettings.DoctorId = model.DoctorId;
                autoGenSettings.LastUpdatedDate = DateTime.UtcNow;
                autoGenSettings.ScheduleSettingsJson = System.Text.Json.JsonSerializer.Serialize(model.ScheduleSettings);

                autoGenSettings = await _autoGenerationSettingsRepository.UpdateAsync(autoGenSettings);
            }

            // Если настройки включены, выполняем генерацию сразу
            if (model.IsEnabled)
            {
                await GenerateScheduleBySettingsAsync(autoGenSettings);
            }

            // Возвращаем результат
            return new AutoGenerationSettingsViewModel
            {
                AutoGenerationSettingsId = autoGenSettings.AutoGenerationSettingsId,
                IsEnabled = autoGenSettings.IsEnabled,
                Scope = autoGenSettings.Scope,
                PeriodType = autoGenSettings.PeriodType,
                NextGenerationDate = autoGenSettings.NextGenerationDate,
                HospitalId = autoGenSettings.HospitalId,
                SpecialityId = autoGenSettings.SpecialityId,
                DoctorId = autoGenSettings.DoctorId,
                ScheduleSettings = model.ScheduleSettings
            };
        }
        
        // Получение настроек автоматической генерации для конкретного врача
        public async Task<AutoGenerationSettingsViewModel> GetAutoGenerationSettingsForDoctorAsync(int doctorId)
        {
            var settings = await _autoGenerationSettingsRepository.GetByDoctorIdAsync(doctorId);
            
            if (settings == null)
            {
                return null;
            }

            // Десериализуем настройки расписания
            var scheduleSettings = System.Text.Json.JsonSerializer.Deserialize<ScheduleSettingsViewModel>(settings.ScheduleSettingsJson);

            return new AutoGenerationSettingsViewModel
            {
                AutoGenerationSettingsId = settings.AutoGenerationSettingsId,
                IsEnabled = settings.IsEnabled,
                Scope = settings.Scope,
                PeriodType = settings.PeriodType,
                NextGenerationDate = settings.NextGenerationDate,
                HospitalId = settings.HospitalId,
                SpecialityId = settings.SpecialityId,
                DoctorId = settings.DoctorId,
                ScheduleSettings = scheduleSettings
            };
        }
        
        // Отключение автоматической генерации
        public async Task<bool> DisableAutoGenerationAsync(int settingsId)
        {
            return await _autoGenerationSettingsRepository.DisableAsync(settingsId);
        }
        
        // Получение всех активных настроек автоматической генерации
        public async Task<List<AutoGenerationSettingsViewModel>> GetAllActiveAutoGenerationSettingsAsync()
        {
            var allSettings = await _autoGenerationSettingsRepository.GetAllActiveAsync();
            
            var result = new List<AutoGenerationSettingsViewModel>();
            
            foreach (var settings in allSettings)
            {
                // Десериализуем настройки расписания
                var scheduleSettings = System.Text.Json.JsonSerializer.Deserialize<ScheduleSettingsViewModel>(settings.ScheduleSettingsJson);
                
                result.Add(new AutoGenerationSettingsViewModel
                {
                    AutoGenerationSettingsId = settings.AutoGenerationSettingsId,
                    IsEnabled = settings.IsEnabled,
                    Scope = settings.Scope,
                    PeriodType = settings.PeriodType,
                    NextGenerationDate = settings.NextGenerationDate,
                    HospitalId = settings.HospitalId,
                    SpecialityId = settings.SpecialityId,
                    DoctorId = settings.DoctorId,
                    ScheduleSettings = scheduleSettings
                });
            }
            
            return result;
        }
        
        // Выполнение запланированных генераций
        public async Task<int> ProcessDueGenerationsAsync()
        {
            // Получаем все настройки, для которых пришло время генерации
            var dueSettings = await _autoGenerationSettingsRepository.GetDueForGenerationAsync(DateTime.UtcNow);
            var processedCount = 0;
            
            foreach (var settings in dueSettings)
            {
                try
                {
                    // Генерируем расписание
                    await GenerateScheduleBySettingsAsync(settings);
                    
                    // Обновляем дату следующей генерации
                    await UpdateNextGenerationDateAsync(settings);
                    
                    processedCount++;
                }
                catch (Exception ex)
                {
                    // Логируем ошибку, но продолжаем обработку других настроек
                    Console.Error.WriteLine($"Ошибка при генерации расписания для настроек {settings.AutoGenerationSettingsId}: {ex.Message}");
                }
            }
            
            return processedCount;
        }

        // Обновление даты следующей генерации на основе периода
        private async Task UpdateNextGenerationDateAsync(AutoGenerationSettings settings)
        {
            // Вычисляем следующую дату генерации на основе текущей даты и периода
            var nextDate = settings.NextGenerationDate;
            
            switch (settings.PeriodType.ToLower())
            {
                case "week":
                    nextDate = nextDate.AddDays(7);
                    break;
                case "month":
                    nextDate = nextDate.AddMonths(1);
                    break;
                case "year":
                    nextDate = nextDate.AddYears(1);
                    break;
                default:
                    // По умолчанию добавляем 1 месяц
                    nextDate = nextDate.AddMonths(1);
                    break;
            }
            
            await _autoGenerationSettingsRepository.UpdateNextGenerationDateAsync(settings.AutoGenerationSettingsId, nextDate);
        }

        // Генерация расписания на основе настроек автогенерации
        private async Task GenerateScheduleBySettingsAsync(AutoGenerationSettings settings)
        {
            // Десериализуем настройки расписания
            var scheduleSettings = System.Text.Json.JsonSerializer.Deserialize<ScheduleSettingsViewModel>(settings.ScheduleSettingsJson);
            
            // Убедимся, что не используется DoctorId=0 в настройках расписания
            if (scheduleSettings.DoctorId <= 0 && settings.Scope == "selectedDoctor" && settings.DoctorId.HasValue && settings.DoctorId.Value > 0)
            {
                scheduleSettings.DoctorId = settings.DoctorId.Value;
            }
            
            // Определяем даты для генерации
            DateTime startDate = settings.NextGenerationDate;
            DateTime endDate;
            
            // Вычисляем дату окончания на основе периода
            switch (settings.PeriodType.ToLower())
            {
                case "week":
                    endDate = startDate.AddDays(6); // 7 дней - 1 = 6 дней (включая стартовый день)
                    break;
                case "month":
                    // Последний день месяца
                    endDate = startDate.AddMonths(1).AddDays(-1);
                    break;
                case "year":
                    // Последний день года
                    endDate = startDate.AddYears(1).AddDays(-1);
                    break;
                default:
                    // По умолчанию генерируем на 1 месяц
                    endDate = startDate.AddMonths(1).AddDays(-1);
                    break;
            }
            
            // Подготавливаем запрос для автоматической генерации
            var autoGenerateRequest = new AutoGenerateScheduleRequestViewModel
            {
                Scope = settings.Scope,
                StartDate = startDate,
                EndDate = endDate,
                Settings = scheduleSettings,
                HospitalId = settings.HospitalId,
                SpecialityId = settings.SpecialityId,
                DoctorId = settings.DoctorId
            };
            
            try
            {
                // Выполняем генерацию расписания
                var result = await AutoGenerateScheduleAsync(autoGenerateRequest);
                
                // Логируем результаты
                if (result is Dictionary<string, object> resultDict)
                {
                    int totalCount = resultDict.ContainsKey("totalCount") ? (int)resultDict["totalCount"] : 0;
                    int successCount = resultDict.ContainsKey("successCount") ? (int)resultDict["successCount"] : 0;
                    
                    Console.WriteLine($"Автоматическая генерация расписания завершена. " +
                                    $"Успешно: {successCount} из {totalCount}. " +
                                    $"Период: {startDate:yyyy-MM-dd} - {endDate:yyyy-MM-dd}. " +
                                    $"Область: {settings.Scope}");
                    
                    if (successCount == 0 && totalCount > 0)
                    {
                        Console.Error.WriteLine($"ВНИМАНИЕ: Не удалось создать ни одного расписания из {totalCount} возможных. " +
                                               $"SettingsId: {settings.AutoGenerationSettingsId}");
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Ошибка при автоматической генерации расписания: {ex.Message}. " +
                                      $"SettingsId: {settings.AutoGenerationSettingsId}");
                throw; // Перебрасываем исключение для правильной обработки на уровне выше
            }
        }
    }
} 