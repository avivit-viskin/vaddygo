using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      IDataExportService — "זכות העיון": מחזיר ללקוחה את **כל** המידע שנשמר
      עליה ועל הגנים שבבעלותה, בקובץ אחד קריא (JSON).

      למה זה נדרש: חוק הגנת הפרטיות מקנה לאדם זכות לעיין במידע שמוחזק עליו.
      עד היום הייתה במערכת רק מחיקה — אפשר היה למחוק הכול, אבל לא לראות מה
      נשמר. זו החצי השנייה של אותה זכות.

      גבולות: מוחזר אך ורק המידע של המשתמשת המבקשת והגנים **שבבעלותה** —
      אותה בקרת גישה של שאר המערכת. סיסמאות, גיבובים וטוקנים לעולם אינם
      נכללים; ייצוא נועד לעיון, לא להעתקת אמצעי הזדהות.

      ⚠️ כלל מחייב: כל טבלה חדשה עם `GroupId` צריכה להתווסף גם כאן וגם
      ב-AccountService (מחיקה). שכחה כאן = ייצוא חלקי שמציג תמונה שגויה.
    */
    public interface IDataExportService
    {
        Task<object?> ExportAsync(int userId);
    }

    public class DataExportService : IDataExportService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<DataExportService> _logger;

        public DataExportService(AppDbContext db, ILogger<DataExportService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<object?> ExportAsync(int userId)
        {
            var user = await _db.Users.AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
            {
                return null;
            }

            var groupIds = await _db.Groups.AsNoTracking()
                .Where(g => g.UserId == userId)
                .Select(g => g.Id)
                .ToListAsync();

            var students = await _db.Students.AsNoTracking()
                .Where(s => s.GroupId != null && groupIds.Contains(s.GroupId.Value))
                .ToListAsync();
            var studentIds = students.Select(s => s.Id).ToList();

            var groups = await _db.Groups.AsNoTracking()
                .Where(g => groupIds.Contains(g.Id))
                .Include(g => g.Categories)
                .ToListAsync();

            var polls = await _db.Polls.AsNoTracking()
                .Where(p => p.GroupId != null && groupIds.Contains(p.GroupId.Value))
                .Include(p => p.Options)
                .ToListAsync();

            var export = new
            {
                // מה הקובץ ומתי הופק — כדי שהקובץ יעמוד בפני עצמו
                exportedAt = DateTime.UtcNow,
                about = "ייצוא מלא של המידע השמור במערכת VaddyGo עבור החשבון הזה. "
                      + "סיסמאות וטוקני גישה אינם נכללים מטעמי אבטחה.",

                account = new
                {
                    user.Id,
                    user.Username,
                    user.Email,
                    user.Role,
                    user.SubscriptionValidUntil,
                    user.CreatedAt,
                    hasGoogleLogin = !string.IsNullOrEmpty(user.GoogleId),
                },

                institutions = groups.Select(g => new
                {
                    g.Id,
                    g.Name,
                    g.City,
                    g.Year,
                    g.ChildrenCount,
                    g.StaffCount,
                    g.Subgroups,
                    g.IsPro,
                    g.ProValidUntil,
                    // פרטי חשבון בנק/סליקה מוחזרים חלקית בלבד — מפתחות סודיים לא
                    bankName = g.BankName,
                    bankHolder = g.BankHolder,
                    categories = g.Categories.Select(c => new
                    {
                        c.Id, c.Name, c.AmountPerChild, c.Installments,
                    }),
                }),

                students,

                payments = await _db.Payments.AsNoTracking()
                    .Where(p => studentIds.Contains(p.StudentId))
                    .ToListAsync(),

                staff = await _db.StaffMembers.AsNoTracking()
                    .Where(s => s.GroupId != null && groupIds.Contains(s.GroupId.Value))
                    .ToListAsync(),

                expenses = await _db.Expenses.AsNoTracking()
                    .Where(e => e.GroupId != null && groupIds.Contains(e.GroupId.Value))
                    .ToListAsync(),

                events = await _db.Events.AsNoTracking()
                    .Where(e => e.GroupId != null && groupIds.Contains(e.GroupId.Value))
                    .ToListAsync(),

                gifts = await _db.Gifts.AsNoTracking()
                    .Where(g => g.GroupId != null && groupIds.Contains(g.GroupId.Value))
                    .ToListAsync(),

                driveFolders = await _db.DriveFolders.AsNoTracking()
                    .Where(d => d.GroupId != null && groupIds.Contains(d.GroupId.Value))
                    .ToListAsync(),

                polls = polls.Select(p => new
                {
                    p.Id, p.Question, p.IsClosed, p.CreatedAt,
                    options = p.Options.Select(o => new { o.Id, o.Text, o.Votes }),
                }),

                // פניות שהוועד שלח לספקים (בקשות הצעת מחיר)
                supplierRequests = await _db.Leads.AsNoTracking()
                    .Where(l => l.GroupId != null && groupIds.Contains(l.GroupId.Value))
                    .ToListAsync(),

                // חברי צוות שהוזמנו לגנים — בלי טוקני ההזמנה עצמם
                teamMembers = await _db.GroupMembers.AsNoTracking()
                    .Where(m => groupIds.Contains(m.GroupId))
                    .Select(m => new { m.GroupId, m.UserId, m.Role })
                    .ToListAsync(),
            };

            _logger.LogInformation(
                "Data export produced (UserId: {UserId}, Groups: {Count})",
                userId, groupIds.Count);
            return export;
        }
    }
}
