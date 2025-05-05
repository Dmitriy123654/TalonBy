using BLL.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace TalonBy.Services
{
    /// <summary>
    /// Фоновая служба для автоматической генерации расписания
    /// </summary>
    public class ScheduleGenerationBackgroundService : BackgroundService
    {
        private readonly ILogger<ScheduleGenerationBackgroundService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _period = TimeSpan.FromHours(6); // Проверка каждые 6 часов
        
        public ScheduleGenerationBackgroundService(
            IServiceProvider serviceProvider,
            ILogger<ScheduleGenerationBackgroundService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }
        
        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Служба автоматической генерации расписания запущена.");
            
            using var timer = new PeriodicTimer(_period);
            
            // Запускаем первую проверку сразу после запуска
            await ProcessDueGenerationsAsync();
            
            try
            {
                while (await timer.WaitForNextTickAsync(stoppingToken))
                {
                    await ProcessDueGenerationsAsync();
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation("Служба автоматической генерации расписания остановлена.");
            }
        }
        
        private async Task ProcessDueGenerationsAsync()
        {
            _logger.LogInformation("Проверка настроек автоматической генерации расписания ({Time}).", DateTimeOffset.Now);
            
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var scheduleService = scope.ServiceProvider.GetRequiredService<IScheduleService>();
                
                // Вызываем метод обработки запланированных генераций
                int processedCount = await scheduleService.ProcessDueGenerationsAsync();
                
                _logger.LogInformation("Обработано {Count} запланированных генераций расписания.", processedCount);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Ошибка при обработке запланированных генераций расписания.");
            }
        }
    }
} 