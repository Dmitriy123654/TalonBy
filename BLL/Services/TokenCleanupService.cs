using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace BLL.Services
{
    /// <summary>
    /// Фоновая служба для периодической очистки устаревших refresh токенов
    /// </summary>
    public class TokenCleanupService : BackgroundService
    {
        private readonly ILogger<TokenCleanupService> _logger;
        private readonly IServiceProvider _serviceProvider;
        private readonly TimeSpan _cleanupInterval = TimeSpan.FromDays(1); // Запускать каждый день

        public TokenCleanupService(
            ILogger<TokenCleanupService> logger,
            IServiceProvider serviceProvider)
        {
            _logger = logger;
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Запуск сервиса автоматической очистки refresh токенов");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Создаем scope для получения scoped сервисов
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        // Получаем AuthService через DI
                        var authService = scope.ServiceProvider.GetRequiredService<IAuthService>();
                        
                        // Запускаем очистку через сервис аутентификации
                        var removedTokensCount = await authService.CleanupExpiredRefreshTokensAsync();
                        
                        _logger.LogInformation($"Очищено {removedTokensCount} устаревших refresh токенов");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Ошибка при очистке refresh токенов");
                }

                // Ждем до следующей запланированной очистки
                await Task.Delay(_cleanupInterval, stoppingToken);
            }
        }
    }
} 