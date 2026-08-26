using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      UsageStatsService — מחשב את משפך ההרשמה בשני הצדדים.

      צד הוועד: "נרשמו" = משתמשות שנפתח להן חשבון. "השלימו" = מי שיש לה כבר גן
      (Group) — כלומר סיימה את אשף ההרשמה. "נעצרו באמצע" = ההפרש.

      צד הספקים: "נרשמו" = כרטיסי ספק שנוצרו. "השלימו" = כרטיס מוכן להצגה
      לוועדים — יש וואטסאפ, לפחות מוצר אחד, לפחות תמונה אחת ואמצעי תשלום.
      אלה בדיוק הקריטריונים שהספק רואה בצ'ק-ליסט שלו (חוץ מהגדרת הכניסה
      הקבועה, שהיא נוחות של הספק ולא תנאי לכך שהוועד יראה כרטיס שלם).

      כל הספירות נעשות במסד (CountAsync) ולא בזיכרון — לא נטענות ישויות.
    */
    public class UsageStatsService : IUsageStatsService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<UsageStatsService> _logger;

        public UsageStatsService(AppDbContext db, ILogger<UsageStatsService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<UsageStatsDto> GetUsageAsync()
        {
            var since30 = DateTime.UtcNow.AddDays(-30);
            var since5 = DateTime.UtcNow.AddDays(-5);

            var users = await _db.Users.CountAsync();
            var usersWithGroup = await _db.Users
                .CountAsync(u => _db.Groups.Any(g => g.UserId == u.Id));
            var usersLast30 = await _db.Users.CountAsync(u => u.CreatedAt >= since30);
            var usersLast5 = await _db.Users.CountAsync(u => u.CreatedAt >= since5);

            var vendors = await _db.Vendors.CountAsync();
            var vendorsReady = await _db.Vendors.CountAsync(v =>
                v.WhatsApp != string.Empty
                && v.Products.Any()
                && v.Products.Any(p => p.ImageUrl != string.Empty)
                && (v.PaymentLink != string.Empty
                    || v.PaymentBit != string.Empty
                    || v.PaymentBankInfo != string.Empty));
            // ספקים ותיקים נוצרו לפני שהוסף CreatedAt ולכן אין להם תאריך —
            // הם פשוט לא נספרים בקצב ההצטרפות, במקום לקבל תאריך מומצא.
            var vendorsLast30 = await _db.Vendors
                .CountAsync(v => v.CreatedAt != null && v.CreatedAt >= since30);
            var vendorsLast5 = await _db.Vendors
                .CountAsync(v => v.CreatedAt != null && v.CreatedAt >= since5);

            // כמה רכשו/קיבלו פרו פעיל (תוקף בעתיד או ללא תפוגה) — בשני הצדדים.
            var now = DateTime.UtcNow;
            var committeesPro = await _db.Groups
                .CountAsync(g => g.IsPro && (g.ProValidUntil == null || g.ProValidUntil >= now));
            var suppliersPro = await _db.Vendors
                .CountAsync(v => v.IsPro && (v.ProValidUntil == null || v.ProValidUntil >= now));

            // פירוט הרשמות לפי קוד הפניה (?ref=) — כמה נרשמו מכל קישור/לקוח.
            var referrals = await _db.Users
                .Where(u => u.ReferralCode != null && u.ReferralCode != string.Empty)
                .GroupBy(u => u.ReferralCode!)
                .Select(g => new ReferralCountDto { Code = g.Key, Count = g.Count() })
                .OrderByDescending(r => r.Count)
                .ToListAsync();

            _logger.LogInformation(
                "Usage stats requested (users: {Users}, vendors: {Vendors})",
                users, vendors);

            return new UsageStatsDto
            {
                Committees = new FunnelDto
                {
                    Registered = users,
                    Completed = usersWithGroup,
                    Stopped = users - usersWithGroup,
                    RegisteredLast5Days = usersLast5,
                    RegisteredLast30Days = usersLast30,
                    Pro = committeesPro,
                },
                Suppliers = new FunnelDto
                {
                    Registered = vendors,
                    Completed = vendorsReady,
                    Stopped = vendors - vendorsReady,
                    RegisteredLast5Days = vendorsLast5,
                    RegisteredLast30Days = vendorsLast30,
                    Pro = suppliersPro,
                },
                Referrals = referrals,
            };
        }
    }
}
