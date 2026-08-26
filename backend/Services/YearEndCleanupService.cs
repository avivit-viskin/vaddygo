using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      YearEndCleanupService — ניקוי סוף שנת לימודים. עבור כל גן:
        • אם NextCleanupAt עדיין לא אותחל — קובעים לו תאריך *עתידי* (30 באוגוסט
          הקרוב) ולא מוחקים דבר. כך גנים קיימים לעולם לא נמחקים "בהפתעה" בהפעלה
          הראשונה של המשימה — רק אחרי שנקבע להם מועד עתידי (עם התראה מראש בממשק).
        • אם הגיע מועד הניקוי — מוחקים את נתוני השנה: תלמידים (וההורים שבתוכם),
          תשלומים, הוצאות (כולל תמונות קבלה), אירועים, מתנות וסקרים. *נשמרים*: החשבון
          והמנוי, פרטי הגן, קטגוריות הגבייה, חברי הצוות (הרשאות), אנשי הצוות
          וקבצים — כדי שהוועד יתחיל שנה חדשה נקייה בלי להקים הכול מחדש.
      מועד הניקוי: **30 באוגוסט** בכל שנה (החלטת בעלת המוצר, 17.08.2026) —
      לפני פתיחת שנת הלימודים, כך שהשנה החדשה מתחילה נקייה. זו גם מדיניות
      שמירת הנתונים של המערכת: נתוני ילדים אינם נשמרים מעבר לשנת הלימודים.
    */
    public class YearEndCleanupService : IYearEndCleanupService
    {
        // כמה ימים לפני המחיקה שולחים התראת מייל (וגם חלון הבאנר בממשק)
        private const int WarningDays = 14;

        private readonly AppDbContext _db;
        private readonly IEmailSender _email;
        private readonly ILogger<YearEndCleanupService> _logger;

        public YearEndCleanupService(
            AppDbContext db, IEmailSender email, ILogger<YearEndCleanupService> logger)
        {
            _db = db;
            _email = email;
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
                    group.NextCleanupAt = NextAugust30(now);
                    await _db.SaveChangesAsync(cancellationToken);
                    continue;
                }

                if (now >= group.NextCleanupAt.Value)
                {
                    await CleanupGroupAsync(group, cancellationToken);
                }
                else if (now >= group.NextCleanupAt.Value.AddDays(-WarningDays)
                         && group.CleanupWarnedAt == null)
                {
                    // שבועיים לפני: התראת מייל לבעל/ת הגן, פעם אחת בכל מחזור
                    await SendWarningEmailAsync(group, cancellationToken);
                }
            }
        }

        private async Task SendWarningEmailAsync(Group group, CancellationToken cancellationToken)
        {
            var email = await _db.Users
                .Where(u => u.Id == group.UserId)
                .Select(u => u.Email)
                .FirstOrDefaultAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(email))
            {
                return;
            }

            var date = group.NextCleanupAt!.Value.ToString("dd/MM/yyyy");
            const string subject = "VaddyGo — נתוני השנה יימחקו בקרוב לקראת שנה חדשה";
            var body =
                $"שלום 🙂\n\n" +
                $"לקראת שנת הלימודים החדשה, נתוני השנה של \"{group.Name}\" יימחקו אוטומטית בתאריך {date}.\n\n" +
                "יימחקו: תלמידים והורים, תשלומים, הוצאות (כולל קבלות), אירועים, מתנות וסקרים.\n" +
                "יישמרו: החשבון והמנוי, קטגוריות הגבייה, וחברי הצוות.\n\n" +
                "אם יש משהו שכדאי לשמור או לייצא — זה הזמן, לפני התאריך.\n\n" +
                "צוות VaddyGo 💗";

            try
            {
                await _email.SendAsync(email, subject, body);
                group.CleanupWarnedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Year-end warning emailed for group {GroupId}", group.Id);
            }
            catch (Exception ex)
            {
                // לא קובעים CleanupWarnedAt — ינוסה שוב מחר; הבאנר בממשק ממילא מוצג
                _logger.LogError(ex, "Year-end warning email failed for group {GroupId}", group.Id);
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

            /*
              סקרים — נוספו למחיקה השנתית (החלטת בעלת המוצר 23.08.2026). הם
              נתוני שנה כמו השאר: שאלה שהוועד שאל את הורי השנה שעברה אינה
              רלוונטית לשנה החדשה.

              ההצבעות והאפשרויות נמחקות **לפני** הסקר עצמו — הן מצביעות עליו,
              ומחיקה בסדר הפוך הייתה נכשלת על מפתח זר.
            */
            var pollIds = await _db.Polls
                .Where(p => p.GroupId == groupId)
                .Select(p => p.Id)
                .ToListAsync(cancellationToken);
            if (pollIds.Count > 0)
            {
                await _db.PollVotes
                    .Where(v => pollIds.Contains(v.PollId))
                    .ExecuteDeleteAsync(cancellationToken);
                await _db.PollOptions
                    .Where(o => pollIds.Contains(o.PollId))
                    .ExecuteDeleteAsync(cancellationToken);
                await _db.Polls
                    .Where(p => pollIds.Contains(p.Id))
                    .ExecuteDeleteAsync(cancellationToken);
            }

            // מקדמים את הגן לשנה החדשה שנפתחת בספטמבר, וקובעים מועד ניקוי לשנה הבאה
            var justEnded = group.NextCleanupAt!.Value;
            group.Year = justEnded.Year;
            group.NextCleanupAt = justEnded.AddYears(1);
            group.CleanupWarnedAt = null; // לקראת התראת המייל של השנה הבאה
            await _db.SaveChangesAsync(cancellationToken);

            await tx.CommitAsync(cancellationToken);
            _logger.LogInformation(
                "Year-end cleanup done for group {GroupId} ({Students} students); next cleanup {Next:yyyy-MM-dd}",
                groupId, studentIds.Count, group.NextCleanupAt);
        }

        // ה-1 בספטמבר הקרוב שעדיין לא עבר (UTC) — פתיחת שנת הלימודים הבאה
        /* ה-30 באוגוסט הקרוב. אם התאריך כבר עבר השנה — של השנה הבאה. */
        private static DateTime NextAugust30(DateTime from)
        {
            var target = new DateTime(from.Year, 8, 30, 0, 0, 0, DateTimeKind.Utc);
            return target <= from ? target.AddYears(1) : target;
        }
    }
}
