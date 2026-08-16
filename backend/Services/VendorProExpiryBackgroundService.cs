namespace ParentCommitteeAPI.Services
{
    /*
      VendorProExpiryBackgroundService — משימת רקע שמריצה פעם ביום את התראת סיום
      מסלול הפרו לספקים. פותחת scope חדש (DbContext) בכל הרצה; כשלים נתפסים
      ונרשמים בלוג בלבד — לא מפילים את השרת. (זהה בתבנית ל-YearEndCleanup.)
    */
    public class VendorProExpiryBackgroundService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<VendorProExpiryBackgroundService> _logger;

        public VendorProExpiryBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<VendorProExpiryBackgroundService> logger)
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
                    var svc = scope.ServiceProvider
                        .GetRequiredService<IVendorProExpiryService>();
                    await svc.RunAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Vendor pro-expiry run failed");
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
