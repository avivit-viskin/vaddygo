using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IBroadcastService — שליחת עדכון אחד לכל בעלי המוסדות.

      נבנה כי לא הייתה שום דרך להודיע לוועדים על שינוי (מבצע פרו, שינוי מדיניות)
      חוץ מהעתקה ידנית לכל אחד. מיילים יש לנו; מספרי וואטסאפ אין, ולכן הערוץ
      היחיד שאפשר לשלוח בו לכולם הוא מייל.

      שלוש הגנות שנבנו לתוכו:
      • **נמען אחד לכל כתובת** — לחשבון אחד יכולים להיות כמה גנים, ובלי הייחוד
        בעלת אותו חשבון הייתה מקבלת את אותה הודעה פעמיים ושלוש.
      • **כישלון בנמען אחד אינו עוצר את השאר** — כתובת שגויה אחת לא תמנע מכל
        השאר לקבל.
      • **דיווח מספרי** (נשלחו/נכשלו) — שליחה המונית שאין עליה משוב היא שליחה
        שאי אפשר לדעת אם הצליחה.
    */
    public interface IBroadcastService
    {
        /* שולח לקהל שנבחר: "owners" (בעלי מוסדות) או "incomplete" (נרשמו ולא הקימו גן). */
        Task<BroadcastResultDto> SendAsync(string audience, string subject, string body);

        /* כמה נמענים ייכללו בקהל — להצגה לפני השליחה, כדי שהאישור יהיה מודע. */
        Task<int> CountRecipientsAsync(string audience);
    }

    public class BroadcastService : IBroadcastService
    {
        private readonly AppDbContext _db;
        private readonly IEmailSender _email;
        private readonly IUnsubscribeService _unsubscribe;
        private readonly IHttpContextAccessor _http;
        private readonly ILogger<BroadcastService> _logger;

        public BroadcastService(
            AppDbContext db, IEmailSender email, IUnsubscribeService unsubscribe,
            IHttpContextAccessor http, ILogger<BroadcastService> logger)
        {
            _db = db;
            _email = email;
            _unsubscribe = unsubscribe;
            _http = http;
            _logger = logger;
        }

        /*
          בעלי מוסדות בלבד — מי שיש לו לפחות גן אחד. משתמש שנרשם ולא הקים גן
          עדיין אינו "בעל מוסד".
        */
        private IQueryable<string> OwnerEmailsQuery() =>
            _db.Users
                .AsNoTracking()
                .Where(u => _db.Groups.Any(g => g.UserId == u.Id))
                .Where(u => u.Email != null && u.Email != "")
                .Select(u => u.Email)
                .Distinct();

        /*
          נרשמו ולא סיימו — משתמשים שאין להם אף גן (עצרו לפני הקמת מוסד). בדיוק
          ה"נעצרו באמצע" בדוח השימוש; מייל לעודד אותם לחזור ולהשלים.
        */
        private IQueryable<string> IncompleteEmailsQuery() =>
            _db.Users
                .AsNoTracking()
                .Where(u => !_db.Groups.Any(g => g.UserId == u.Id))
                .Where(u => u.Email != null && u.Email != "")
                .Select(u => u.Email)
                .Distinct();

        /*
          ספקים — כל הספקים הרשומים (לפי מייל ההתחברות). לשליחת תזכורות כמו
          רענון הקטלוג / הוספת מוצרים.
        */
        private IQueryable<string> SupplierEmailsQuery() =>
            _db.Vendors
                .AsNoTracking()
                .Where(v => v.LoginEmail != null && v.LoginEmail != "")
                .Select(v => v.LoginEmail)
                .Distinct();

        /*
          ספקים שלא העלו אף מוצר — כרטיס ריק שהוועדים לא רואים בו כלום. תזכורת
          ממוקדת להוסיף מוצר ראשון.
        */
        private IQueryable<string> SuppliersWithoutProductsEmailsQuery() =>
            _db.Vendors
                .AsNoTracking()
                .Where(v => v.LoginEmail != null && v.LoginEmail != "")
                .Where(v => !v.Products.Any())
                .Select(v => v.LoginEmail)
                .Distinct();

        /*
          בוחר את שאילתת הנמענים לפי הקהל (ברירת מחדל: בעלי מוסדות), ומחריג כל
          כתובת שביקשה להסיר את עצמה מרשימת התפוצה — כך שהיא "יורדת" גם מהספירה
          וגם מהשליחה.
        */
        private IQueryable<string> EmailsForAudience(string? audience)
        {
            var a = (audience ?? string.Empty).Trim().ToLowerInvariant();
            var query = a switch
            {
                "incomplete" => IncompleteEmailsQuery(),
                "suppliers" => SupplierEmailsQuery(),
                "suppliers_empty" => SuppliersWithoutProductsEmailsQuery(),
                _ => OwnerEmailsQuery(),
            };
            return query.Where(e => !_db.EmailOptOuts.Any(o => o.Email == e));
        }

        public async Task<int> CountRecipientsAsync(string audience) =>
            await EmailsForAudience(audience).CountAsync();

        public async Task<BroadcastResultDto> SendAsync(
            string audience, string subject, string body)
        {
            var recipients = await EmailsForAudience(audience).ToListAsync();
            var result = new BroadcastResultDto { Total = recipients.Count };

            // בסיס הכתובת לקישור ההסרה — מתוך בקשת המנהלת (host הציבורי של השרת).
            var req = _http.HttpContext?.Request;
            var baseUrl = req != null ? $"{req.Scheme}://{req.Host}" : string.Empty;

            foreach (var address in recipients)
            {
                try
                {
                    // קישור הסרה אישי (טוקן חתום) בתחתית כל מייל — חובה בדיוור המוני.
                    var bodyWithFooter = body;
                    if (baseUrl.Length > 0)
                    {
                        var link = $"{baseUrl}/api/public/unsubscribe?token={_unsubscribe.CreateToken(address)}";
                        bodyWithFooter = body
                            + "\n\n———\nלא מעוניינים לקבל עדכונים מ-VaddyGo? להסרה מרשימת התפוצה:\n"
                            + link;
                    }
                    await _email.SendAsync(address, subject, bodyWithFooter);
                    result.Sent += 1;
                }
                catch (Exception ex)
                {
                    // כישלון בנמען אחד אינו עוצר את השאר. הכתובת עצמה אינה
                    // נרשמת ללוג — מידע אישי, והלוגים אינם ניתנים למחיקה.
                    result.Failed += 1;
                    _logger.LogWarning(ex, "Broadcast failed for one recipient");
                }
            }

            _logger.LogInformation(
                "Broadcast finished ({Sent} sent, {Failed} failed, {Total} recipients)",
                result.Sent, result.Failed, result.Total);
            return result;
        }
    }
}
