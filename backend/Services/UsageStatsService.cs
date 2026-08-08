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
            var since = DateTime.UtcNow.AddDays(-30);

            var users = await _db.Users.CountAsync();
            var usersWithGroup = await _db.Users
                .CountAsync(u => _db.Groups.Any(g => g.UserId == u.Id));
            var usersLast30 = await _db.Users.CountAsync(u => u.CreatedAt >= since);

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
                .CountAsync(v => v.CreatedAt != null && v.CreatedAt >= since);

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
                    RegisteredLast30Days = usersLast30,
                },
                Suppliers = new FunnelDto
                {
                    Registered = vendors,
                    Completed = vendorsReady,
                    Stopped = vendors - vendorsReady,
                    RegisteredLast30Days = vendorsLast30,
                },
            };
        }
    }
}
