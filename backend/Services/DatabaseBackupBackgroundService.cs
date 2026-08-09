namespace ParentCommitteeAPI.Services
{
    /*
      DatabaseBackupBackgroundService — מריצה את הגיבוי אוטומטית: פעם בעלייה
      (כדי שתמיד יהיה גיבוי טרי אחרי פריסה) ואז כל X שעות.

      כשלים נרשמים בלוג ולא מפילים את השרת — גיבוי שנכשל אסור שיוריד את
      המערכת לוועדים. תדירות: Backup:IntervalHours (ברירת מחדל 24).
    */
    public class DatabaseBackupBackgroundService : BackgroundService
    {
        private const int DefaultIntervalHours = 24;

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IConfiguration _config;
        private readonly ILogger<DatabaseBackupBackgroundService> _logger;

        public DatabaseBackupBackgroundService(
            IServiceScopeFactory scopeFactory,
            IConfiguration config,
            ILogger<DatabaseBackupBackgroundService> logger)
        {
            _scopeFactory = scopeFactory;
            _config = config;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            var hours = Math.Max(1, _config.GetValue("Backup:IntervalHours", DefaultIntervalHours));
            var interval = TimeSpan.FromHours(hours);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var backup = scope.ServiceProvider.GetRequiredService<IDatabaseBackupService>();
                    await backup.RunAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Database backup run failed");
                }

                try
                {
                    await Task.Delay(interval, stoppingToken);
                }
                catch (TaskCanceledException)
                {
                    break; // כיבוי מסודר
                }
            }
        }
    }
}
