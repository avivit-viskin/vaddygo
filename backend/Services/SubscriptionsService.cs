using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      ISubscriptionsService — תמונת המנויים של VaddyGo למנהלת (SuperAdmin).
      מרכז את שני ערוצי ההכנסה: פרו של ועדים ופרו של ספקים.
    */
    public interface ISubscriptionsService
    {
        Task<SubscriptionsDto> GetAsync();
    }

    public class SubscriptionsService : ISubscriptionsService
    {
        /* "פג בקרוב" = בתוך 30 יום — חלון סביר ליצירת קשר לפני שהמנוי נסגר. */
        private const int ExpiringWindowDays = 30;

        private readonly AppDbContext _db;
        private readonly IConfiguration _config;

        public SubscriptionsService(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
        }

        public async Task<SubscriptionsDto> GetAsync()
        {
            var today = DateTime.UtcNow.Date;

            // תאריך ההקמה של הגן = מועד יצירת חשבון הבעלים (הגן נוצר באשף מיד אחרי
            // ההרשמה). כך יש תאריך אמיתי גם לגנים ותיקים, בלי עמודה חדשה במסד.
            var committees = await _db.Groups
                .AsNoTracking()
                .OrderByDescending(g => _db.Users
                    .Where(u => u.Id == g.UserId)
                    .Select(u => u.CreatedAt)
                    .FirstOrDefault())
                .Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.IsPro,
                    Until = g.ProValidUntil,
                    Created = _db.Users
                        .Where(u => u.Id == g.UserId)
                        .Select(u => (DateTime?)u.CreatedAt)
                        .FirstOrDefault(),
                    Email = _db.Users
                        .Where(u => u.Id == g.UserId)
                        .Select(u => u.Email)
                        .FirstOrDefault(),
                    Phone = _db.Users
                        .Where(u => u.Id == g.UserId)
                        .Select(u => u.TwoFactorPhone)
                        .FirstOrDefault(),
                    Protected = _db.Users
                        .Where(u => u.Id == g.UserId)
                        .Select(u => u.IsProtected)
                        .FirstOrDefault(),
                    HasCategories = g.Categories.Any(),
                })
                .ToListAsync();

            // מצב השלמת ההגדרה: אילו גנים כבר יש בהם תלמידים (כדי לאחד את
            // "הושלם / לא הושלם" לתוך רשימת הוועדים כאן, בלי רשימה נפרדת).
            var committeeIdsWithStudents = new HashSet<int>(
                await _db.Students
                    .Where(s => s.GroupId != null)
                    .Select(s => s.GroupId!.Value)
                    .Distinct()
                    .ToListAsync());

            var suppliers = await _db.Vendors
                .AsNoTracking()
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new
                {
                    v.Id,
                    v.Name,
                    v.IsPro,
                    Until = v.ProValidUntil,
                    Created = v.CreatedAt,
                    Email = v.LoginEmail,
                    Phone = v.WhatsApp,
                })
                .ToListAsync();

            // נרשמים שלא השלימו — משתמשים ללא אף גן (נעצרו באשף ההקמה). מוצגים
            // למנהלת כדי לפנות אליהם (מייל) או לנקות חשבונות-בדיקה. אין להם ועד,
            // ולכן אין נתונים אישיים מעבר למייל / טלפון-2FA / תאריך.
            var incomplete = await _db.Users
                .AsNoTracking()
                .Where(u => u.Role != "SuperAdmin"
                    && !_db.Groups.Any(g => g.UserId == u.Id))
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id,
                    u.Email,
                    Phone = u.TwoFactorPhone,
                    Created = (DateTime?)u.CreatedAt,
                    Protected = u.IsProtected,
                })
                .ToListAsync();

            /*
              חשבונות מוגנים (בוט הבדיקות) מסומנים במסך, כדי שלא ינוסה למחוק
              אותם ולא ייראה כאילו המחיקה "נכשלה". ההגנה עצמה נאכפת בשרת.
            */
            var protectedEmails = ProtectedAccounts.Emails(_config);

            var result = new SubscriptionsDto
            {
                /*
                  לוועדים מועבר גם מועד ההרשמה, כי הפרו החינמי (עד 1.10) נגזר
                  ממנו. בלי זה המסך היה מציג "לא מנוי" לכל המוסדות בזמן שלכולם
                  יש פרו בפועל — כלומר סותר את שאר המערכת.

                  הספקים צורפו למבצע ב-02.09.2026 (החלטת בעלת המוצר) ולכן
                  מקבלים מעכשיו את אותו טיפול — עד אז הם מופו בלי תאריך
                  ומעולם לא הוצגו כ"פרו חינם".
                */
                Committees = committees
                    .Select(c =>
                    {
                        var row = Mark(ToRow(
                            c.Id, c.Name, c.IsPro, c.Until, c.Created, c.Email, c.Phone,
                            today, registeredAt: c.Created), c.Protected, protectedEmails);
                        row.HasCategories = c.HasCategories;
                        row.HasStudents = committeeIdsWithStudents.Contains(c.Id);
                        row.Complete = row.HasCategories && row.HasStudents;
                        return row;
                    })
                    .ToList(),
                Suppliers = suppliers
                    .Select(s => ToRow(
                        s.Id, s.Name, s.IsPro, s.Until, s.Created, s.Email, s.Phone,
                        today, registeredAt: s.Created))
                    .ToList(),
                IncompleteSignups = incomplete
                    .Select(u => new SubscriptionRowDto
                    {
                        Id = u.Id,
                        Name = u.Email, // אין שם עסק — מציגים את המייל
                        Email = u.Email,
                        Phone = u.Phone ?? string.Empty,
                        CreatedAt = u.Created,
                        Status = "incomplete",
                        IsProtected = u.Protected
                            || protectedEmails.Contains((u.Email ?? "").ToLowerInvariant()),
                    })
                    .ToList(),
            };

            var all = result.Committees.Concat(result.Suppliers).ToList();
            // "פעיל" = משלם. הפרו החינמי נספר בנפרד ובכוונה — אחרת מספר
            // המנויים היה קופץ לגובה בזמן המבצע ומתרסק ב-1.10 בלי שקרה כלום.
            result.ActiveCount = all.Count(r => r.Status == "active" || r.Status == "expiring");
            result.ExpiringSoonCount = all.Count(r => r.Status == "expiring");
            result.TrialCount = all.Count(r => r.Status == "trial");
            return result;
        }

        /* מסמן שורה כמוגנת — דגל במסד או כתובת ברשימה. ראה ProtectedAccounts. */
        private static SubscriptionRowDto Mark(
            SubscriptionRowDto row, bool flagged, HashSet<string> protectedEmails)
        {
            row.IsProtected = flagged
                || protectedEmails.Contains((row.Email ?? string.Empty).ToLowerInvariant());
            return row;
        }

        /*
          מתרגם דגל+תוקף לסטטוס אחד שהמסך מציג. הסדר חשוב: מי שאינו מנוי הוא
          "free" גם אם נשאר לו תאריך ישן, ומנוי בלי תאריך הוא "active" לתמיד
          (פתיחה ידנית של המנהלת).
        */
        private static SubscriptionRowDto ToRow(
            int id, string name, bool isPro, DateTime? until, DateTime? created,
            string? email, string? phone, DateTime today, DateTime? registeredAt)
        {
            var row = new SubscriptionRowDto
            {
                Id = id,
                Name = name,
                IsPro = isPro,
                ValidUntil = until,
                CreatedAt = created,
                Email = email ?? string.Empty,
                Phone = phone ?? string.Empty,
            };

            if (!isPro)
            {
                /*
                  אינו מנוי בתשלום — אבל ייתכן שהפרו פתוח לו ללא עלות (המבצע
                  עד 1.10). מצב שלישי ונפרד, ולא "active": המסך הזה עונה על
                  "מי משלם לי", ולצבוע את כולם כמנויים היה מרוקן אותו מתוכן
                  בדיוק בחודש שבו הכול חינם.
                */
                if (registeredAt != null
                    && ProPolicy.IsTrialActive(null, registeredAt))
                {
                    row.Status = "trial";
                    row.ValidUntil = ProPolicy.EffectiveTrialEnd(null, registeredAt);
                    row.DaysLeft = (row.ValidUntil.Value.Date - today).Days;
                    return row;
                }
                row.Status = "free";
                return row;
            }
            if (until == null)
            {
                row.Status = "active";
                return row;
            }

            var daysLeft = (until.Value.Date - today).Days;
            row.DaysLeft = daysLeft;
            row.Status = daysLeft < 0
                ? "expired"
                : daysLeft <= ExpiringWindowDays ? "expiring" : "active";
            return row;
        }
    }
}
