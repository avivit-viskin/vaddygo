using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      ExpenseTrashPurgeBackgroundService — מוחקת לצמיתות פריטים שנמחקו-רכות (סל
      המיחזור) לפני יותר מ-TrashRetentionDays. רצה בעלייה ואז כל 24 שעות.

      מערכתי (כל המוסדות) ולכן ניגש ישירות ל-AppDbContext ולא דרך ExpenseService
      (שתלוי ב-IAccessScope של בקשת HTTP, שאינו קיים במשימת רקע). כשל נרשם בלוג
      ולא מפיל את השרת.
    */
    public class ExpenseTrashPurgeBackgroundService : BackgroundService
    {
        private static readonly TimeSpan Interval = TimeSpan.FromHours(24);

        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<ExpenseTrashPurgeBackgroundService> _logger;

        public ExpenseTrashPurgeBackgroundService(
            IServiceScopeFactory scopeFactory,
            ILogger<ExpenseTrashPurgeBackgroundService> logger)
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
                    await PurgeAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Expense trash purge run failed");
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

        private async Task PurgeAsync(CancellationToken ct)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            var cutoff = DateTime.UtcNow.AddDays(-ExpenseService.TrashRetentionDays);
            var expired = await db.Expenses
                .IgnoreQueryFilters()
                .Where(e => e.IsDeleted && e.DeletedAt != null && e.DeletedAt < cutoff)
                .ToListAsync(ct);

            if (expired.Count == 0)
            {
                return;
            }

            db.Expenses.RemoveRange(expired);
            await db.SaveChangesAsync(ct);
            _logger.LogInformation(
                "Expense trash purge — permanently deleted {Count} item(s) older than {Days} days",
                expired.Count, ExpenseService.TrashRetentionDays);
        }
    }
}
