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

        public SubscriptionsService(AppDbContext db)
        {
            _db = db;
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
                })
                .ToListAsync();

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
                })
                .ToListAsync();

            var result = new SubscriptionsDto
            {
                Committees = committees
                    .Select(c => ToRow(c.Id, c.Name, c.IsPro, c.Until, c.Created, today))
                    .ToList(),
                Suppliers = suppliers
                    .Select(s => ToRow(s.Id, s.Name, s.IsPro, s.Until, s.Created, today))
                    .ToList(),
            };

            var all = result.Committees.Concat(result.Suppliers).ToList();
            result.ActiveCount = all.Count(r => r.Status == "active" || r.Status == "expiring");
            result.ExpiringSoonCount = all.Count(r => r.Status == "expiring");
            return result;
        }

        /*
          מתרגם דגל+תוקף לסטטוס אחד שהמסך מציג. הסדר חשוב: מי שאינו מנוי הוא
          "free" גם אם נשאר לו תאריך ישן, ומנוי בלי תאריך הוא "active" לתמיד
          (פתיחה ידנית של המנהלת).
        */
        private static SubscriptionRowDto ToRow(
            int id, string name, bool isPro, DateTime? until, DateTime? created, DateTime today)
        {
            var row = new SubscriptionRowDto
            {
                Id = id,
                Name = name,
                IsPro = isPro,
                ValidUntil = until,
                CreatedAt = created,
            };

            if (!isPro)
            {
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
