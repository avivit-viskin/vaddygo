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
        Task<BroadcastResultDto> SendToCommitteeOwnersAsync(string subject, string body);

        /* כמה נמענים ייכללו — להצגה לפני השליחה, כדי שהאישור יהיה מודע. */
        Task<int> CountRecipientsAsync();
    }

    public class BroadcastService : IBroadcastService
    {
        private readonly AppDbContext _db;
        private readonly IEmailSender _email;
        private readonly ILogger<BroadcastService> _logger;

        public BroadcastService(
            AppDbContext db, IEmailSender email, ILogger<BroadcastService> logger)
        {
            _db = db;
            _email = email;
            _logger = logger;
        }

        /*
          בעלי מוסדות בלבד — מי שיש לו לפחות גן אחד. משתמש שנרשם ולא הקים גן
          עדיין אינו "בעל מוסד", ואין סיבה לעדכן אותו על מסלול של מערכת שלא
          התחיל להשתמש בה.
        */
        private IQueryable<string> OwnerEmailsQuery() =>
            _db.Users
                .AsNoTracking()
                .Where(u => _db.Groups.Any(g => g.UserId == u.Id))
                .Where(u => u.Email != null && u.Email != "")
                .Select(u => u.Email)
                .Distinct();

        public async Task<int> CountRecipientsAsync() =>
            await OwnerEmailsQuery().CountAsync();

        public async Task<BroadcastResultDto> SendToCommitteeOwnersAsync(
            string subject, string body)
        {
            var recipients = await OwnerEmailsQuery().ToListAsync();
            var result = new BroadcastResultDto { Total = recipients.Count };

            foreach (var address in recipients)
            {
                try
                {
                    await _email.SendAsync(address, subject, body);
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
