using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      VendorProExpiryService — שולח לספק מייל "מסלול הפרו מסתיים בקרוב" שבועיים
      לפני שהתוקף (ProValidUntil) פג, פעם אחת בכל מחזור (ProWarnedAt). מקביל
      להתראת סוף-השנה של הוועד.

      • מנוי בלי תאריך (פתיחה ידנית של המנהלת) אינו פג — ולכן אינו מקבל התראה.
      • אחרי התפוגה הפרו נכבה אוטומטית (VendorProPolicy) — הכרטיס והמוצרים
        נשארים ומוצגים לוועדים (מסלול חינמי), רק תוספות הפרו ייכבו.
      • חידוש (VendorProPaymentService) מאפס את ProWarnedAt כדי להתריע שוב בשנה
        הבאה.
    */
    public class VendorProExpiryService : IVendorProExpiryService
    {
        // כמה ימים לפני התפוגה שולחים את ההתראה (זהה לוועד)
        private const int WarningDays = 14;

        private readonly AppDbContext _db;
        private readonly IEmailSender _email;
        private readonly ILogger<VendorProExpiryService> _logger;

        public VendorProExpiryService(
            AppDbContext db, IEmailSender email, ILogger<VendorProExpiryService> logger)
        {
            _db = db;
            _email = email;
            _logger = logger;
        }

        public async Task RunAsync(CancellationToken cancellationToken = default)
        {
            var now = DateTime.UtcNow;
            var windowEnd = now.AddDays(WarningDays);

            // ספקים במסלול פרו שהתוקף שלהם בתוך 14 יום (וטרם פג), שטרם הותרעו,
            // ושיש להם מייל לשליחה.
            var vendors = await _db.Vendors
                .Where(v => v.IsPro
                    && v.ProValidUntil != null
                    && v.ProValidUntil > now
                    && v.ProValidUntil <= windowEnd
                    && v.ProWarnedAt == null
                    && v.LoginEmail != "")
                .ToListAsync(cancellationToken);

            foreach (var vendor in vendors)
            {
                await SendWarningEmailAsync(vendor, cancellationToken);
            }
        }

        private async Task SendWarningEmailAsync(Vendor vendor, CancellationToken cancellationToken)
        {
            var date = vendor.ProValidUntil!.Value.ToString("dd/MM/yyyy");
            var hi = string.IsNullOrWhiteSpace(vendor.Name) ? "ספק יקר" : vendor.Name;
            const string subject = "VaddyGo — מסלול הפרו שלך מסתיים בקרוב";
            var body =
                $"שלום {hi} 🙂\n\n" +
                $"מסלול הפרו שלך ב-VaddyGo מסתיים בתאריך {date}.\n\n" +
                "כדי לשמור על ההטבות — מבצע מיוחד לוועדים, תיבת פניות (בקשות הצעת מחיר), " +
                "וקטלוג ממותג — כדאי לחדש את המנוי לפני התאריך.\n\n" +
                "אם לא תחדשו, הכרטיס והמוצרים שלכם יישארו ויוצגו לוועדים כרגיל — רק " +
                "תוספות הפרו ייכבו (חזרה למסלול החינמי).\n\n" +
                "צוות VaddyGo 🩷";

            try
            {
                await _email.SendAsync(vendor.LoginEmail, subject, body);
                vendor.ProWarnedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
                _logger.LogInformation(
                    "Vendor pro-expiry warning emailed (VendorId: {VendorId})", vendor.Id);
            }
            catch (Exception ex)
            {
                // לא קובעים ProWarnedAt — ינוסה שוב מחר
                _logger.LogError(ex,
                    "Vendor pro-expiry warning email failed (VendorId: {VendorId})", vendor.Id);
            }
        }
    }
}
