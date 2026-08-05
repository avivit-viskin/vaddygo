using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      YearEndCleanupService — ניקוי סוף שנת לימודים. עבור כל גן:
        • אם NextCleanupAt עדיין לא אותחל — קובעים לו תאריך *עתידי* (1 בספטמבר
          הקרוב) ולא מוחקים דבר. כך גנים קיימים לעולם לא נמחקים "בהפתעה" בהפעלה
          הראשונה של המשימה — רק אחרי שנקבע להם מועד עתידי (עם התראה מראש בממשק).
        • אם הגיע מועד הניקוי — מוחקים את נתוני השנה: תלמידים (וההורים שבתוכם),
          תשלומים, הוצאות (כולל תמונות קבלה), אירועים ומתנות. *נשמרים*: החשבון
          והמנוי, פרטי הגן, קטגוריות הגבייה, חברי הצוות (הרשאות), אנשי הצוות
          וקבצים — כדי שהוועד יתחיל שנה חדשה נקייה בלי להקים הכול מחדש.
      החישוב עוגן ל-1 בספטמבר (פתיחת שנת הלימודים), בהתאם לשדה Group.Year.
    */
    public class YearEndCleanupService : IYearEndCleanupService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<YearEndCleanupService> _logger;

        public YearEndCleanupService(AppDbContext db, ILogger<YearEndCleanupService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var groups = await _db.Groups.ToListAsync(cancellationToken);

            foreach (var group in groups)
            {
                if (group.NextCleanupAt == null)
                {
                    // אתחול בטוח: תמיד תאריך עתידי — בלי מחיקה בהפעלה הראשונה
                    group.NextCleanupAt = NextSeptember1(now);
                    await _db.SaveChangesAsync(cancellationToken);
                    continue;
                }

                if (now >= group.NextCleanupAt.Value)
                {
                    await CleanupGroupAsync(group, cancellationToken);
                }
            }
        }

        private async Task CleanupGroupAsync(Group group, CancellationToken cancellationToken)
        {
            var groupId = group.Id;
            await using var tx = await _db.Database.BeginTransactionAsync(cancellationToken);

            // תשלומים של תלמידי הגן קודם (מצביעים על התלמידים)
            var studentIds = await _db.Students
                .Where(s => s.GroupId == groupId)
                .Select(s => s.Id)
                .ToListAsync(cancellationToken);
            if (studentIds.Count > 0)
            {
                await _db.Payments
                    .Where(p => studentIds.Contains(p.StudentId))
                    .ExecuteDeleteAsync(cancellationToken);
            }

            // נתוני השנה: תלמידים+הורים, הוצאות (כולל קבלות), אירועים, מתנות
            await _db.Students.Where(s => s.GroupId == groupId).ExecuteDeleteAsync(cancellationToken);
            await _db.Expenses.Where(e => e.GroupId == groupId).ExecuteDeleteAsync(cancellationToken);
            await _db.Gifts.Where(g => g.GroupId == groupId).ExecuteDeleteAsync(cancellationToken);
            await _db.Events.Where(e => e.GroupId == groupId).ExecuteDeleteAsync(cancellationToken);

            // מקדמים את הגן לשנה החדשה שנפתחת בספטמבר, וקובעים מועד ניקוי לשנה הבאה
            var justEnded = group.NextCleanupAt!.Value;
            group.Year = justEnded.Year;
            group.NextCleanupAt = justEnded.AddYears(1);
            await _db.SaveChangesAsync(cancellationToken);

            await tx.CommitAsync(cancellationToken);
            _logger.LogInformation(
                "Year-end cleanup done for group {GroupId} ({Students} students); next cleanup {Next:yyyy-MM-dd}",
                groupId, studentIds.Count, group.NextCleanupAt);
        }

        // ה-1 בספטמבר הקרוב שעדיין לא עבר (UTC) — פתיחת שנת הלימודים הבאה
        private static DateTime NextSeptember1(DateTime from)
        {
            var sep = new DateTime(from.Year, 9, 1, 0, 0, 0, DateTimeKind.Utc);
            return sep <= from ? sep.AddYears(1) : sep;
        }
    }
}
