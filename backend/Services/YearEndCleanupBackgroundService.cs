namespace ParentCommitteeAPI.Services
{
    /*
      YearEndCleanupBackgroundService — משימת רקע שמריצה את ניקוי סוף השנה פעם
      ביום. משתמשת ב-IServiceScopeFactory כדי לפתוח scope חדש (DbContext) בכל
      הרצה. כשלים נתפסים ונרשמים בלוג בלבד — לא מפילים את השרת.
    */
    public class YearEndCleanupBackgroundService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<YearEndCleanupBackgroundService> _logger;

        public YearEndCleanupBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<YearEndCleanupBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var cleanup = scope.ServiceProvider.GetRequiredService<IYearEndCleanupService>();
                    await cleanup.RunAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Year-end cleanup run failed");
                }

                try
                {
                    await Task.Delay(Interval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break; // כיבוי מסודר
                }
            }
        }
    }
}
