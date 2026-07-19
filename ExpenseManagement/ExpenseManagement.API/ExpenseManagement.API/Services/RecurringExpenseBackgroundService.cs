using ExpenseManagement.API.Contracts;

namespace ExpenseManagement.API.Services
{
    public class RecurringExpenseBackgroundService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<RecurringExpenseBackgroundService> _logger;
        private static readonly TimeSpan Interval = TimeSpan.FromHours(1);

        public RecurringExpenseBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<RecurringExpenseBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Recurring expense background service started.");
            using var timer = new PeriodicTimer(Interval);

            await ProcessOnce(stoppingToken);
            while (await timer.WaitForNextTickAsync(stoppingToken))
                await ProcessOnce(stoppingToken);
        }

        private async Task ProcessOnce(CancellationToken stoppingToken)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var repository = scope.ServiceProvider.GetRequiredService<IRecurringExpenseRepository>();
                await repository.ProcessDueRecurringExpenses(stoppingToken);
                _logger.LogInformation("Processed recurring expenses at {Time}", DateTime.UtcNow);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Recurring expense processing failed; the service will retry on the next interval.");
            }
        }
    }
}
