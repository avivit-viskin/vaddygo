using Microsoft.EntityFrameworkCore;

namespace ParentCommitteeAPI.Services
{
    /*
      ProActivationService — הפעלת מסלול פרו אוטומטית אחרי תשלום (webhook מ-GROW).
      מזהה את היעד לפי שדה-מזהה מפורש (groupId/vendorId שהעברנו בקישור התשלום) או,
      כגיבוי, לפי מייל המשלם. פותח פרו עם תוקף שנה. מפריד מ-SetPro הידני של המנהלת
      (שנשאר בלי תפוגה), כדי שרכישה אוטומטית תיתן תוקף שנתי כמו מנוי בתשלום.
    */
    public interface IProActivationService
    {
        /* פרו לוועד — לפי groupId מפורש, ואם אין, לפי המייל של בעל/ת החשבון. */
        Task<bool> ActivateCommitteeAsync(int? groupId, string? email, DateTime validUntil);

        /*
          כיבוי מסלול פרו לגן. נדרש כדי שפתיחה ידנית של המנהלת תהיה הפיכה —
          פעולה שאפשר רק להפעיל ואי אפשר לבטל היא מלכודת, במיוחד כשהיא ניתנת
          בלחיצה אחת. יושב כאן ולא בבקר כדי שהדלקה וכיבוי יהיו באותו מקום.
        */
        Task<bool> DeactivateCommitteeAsync(int groupId);

        /* פרו לספק — לפי vendorId מפורש; אם אין, לפי מייל ההתחברות; ואם אין, לפי
           מספר הוואטסאפ של הספק מול טלפון המשלם (GROW מחזיר payerPhone גם ב-ApplePay). */
        Task<bool> ActivateSupplierAsync(int? vendorId, string? email, string? phone, DateTime validUntil);
    }

    public class ProActivationService : IProActivationService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<ProActivationService> _logger;

        public ProActivationService(AppDbContext db, ILogger<ProActivationService> logger)
        {
            _db = db;
            _logger = logger;
        }

        public async Task<bool> ActivateCommitteeAsync(int? groupId, string? email, DateTime validUntil)
        {
            List<Models.Group> groups;
            if (groupId is int gid)
            {
                var g = await _db.Groups.FirstOrDefaultAsync(x => x.Id == gid);
                groups = g == null ? new() : new() { g };
            }
            else
            {
                var e = (email ?? string.Empty).Trim().ToLowerInvariant();
                if (e.Length == 0)
                {
                    groups = new();
                }
                else
                {
                    var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == e);
                    groups = user == null
                        ? new()
                        : await _db.Groups.Where(x => x.UserId == user.Id).ToListAsync();
                }
            }

            if (groups.Count == 0)
            {
                // בלי הכתובת עצמה: לוגים אצל ספק האירוח נשמרים 7 ימים ואינם
                // ניתנים למחיקה לפי בקשה, ולכן אינם מקום למידע אישי. הדומיין
                // מספיק כדי לאבחן ("כל הפניות מ-gmail נכשלות").
                _logger.LogWarning(
                    "Pro activation (committee) — no group matched (groupId: {GroupId}, domain: {Domain})",
                    groupId, EmailDomain(email));
                return false;
            }

            foreach (var g in groups)
            {
                g.IsPro = true;
                g.ProValidUntil = validUntil;
            }
            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Pro activated for {Count} committee group(s) until {Until} (groupId: {GroupId})",
                groups.Count, validUntil, groupId);
            return true;
        }

        public async Task<bool> DeactivateCommitteeAsync(int groupId)
        {
            var group = await _db.Groups.FirstOrDefaultAsync(g => g.Id == groupId);
            if (group == null)
            {
                return false;
            }

            group.IsPro = false;
            // גם התוקף מתאפס: תאריך שנשאר תלוי בלי מסלול פעיל מבלבל בקריאת
            // המסך ועלול להיראות כאילו המנוי עדיין בתוקף.
            group.ProValidUntil = null;
            await _db.SaveChangesAsync();
            _logger.LogInformation("Pro deactivated for committee group {GroupId}", groupId);
            return true;
        }

        public async Task<bool> ActivateSupplierAsync(int? vendorId, string? email, string? phone, DateTime validUntil)
        {
            Models.Vendor? vendor = null;
            if (vendorId is int vid)
            {
                vendor = await _db.Vendors.FirstOrDefaultAsync(x => x.Id == vid);
            }

            if (vendor == null)
            {
                var e = (email ?? string.Empty).Trim().ToLowerInvariant();
                if (e.Length > 0)
                {
                    vendor = await _db.Vendors.FirstOrDefaultAsync(x => x.LoginEmail == e);
                }
            }

            // גיבוי אחרון — לפי מספר הוואטסאפ של הספק מול טלפון המשלם. משווים
            // ספרות בלבד (10 אחרונות) כדי לגשר על פורמטים (מקפים / +972).
            if (vendor == null)
            {
                var p = NormalizePhone(phone);
                if (p.Length >= 9)
                {
                    var candidates = await _db.Vendors
                        .Where(x => x.WhatsApp != null && x.WhatsApp != "")
                        .ToListAsync();
                    vendor = candidates.FirstOrDefault(x => NormalizePhone(x.WhatsApp) == p);
                }
            }

            if (vendor == null)
            {
                _logger.LogWarning(
                    "Pro activation (supplier) — no vendor matched (vendorId: {VendorId}, domain: {Domain})",
                    vendorId, EmailDomain(email));
                return false;
            }

            vendor.IsPro = true;
            vendor.ProValidUntil = validUntil;
            await _db.SaveChangesAsync();
            _logger.LogInformation(
                "Pro activated for supplier {VendorId} until {Until}", vendor.Id, validUntil);
            return true;
        }

        /* דומיין בלבד לצורכי לוג — ראו ההערה בהפעלה למעלה. */
        private static string EmailDomain(string? email)
        {
            var at = (email ?? string.Empty).LastIndexOf('@');
            return at >= 0 && at < email!.Length - 1 ? email[(at + 1)..] : "unknown";
        }

        // ספרות בלבד; +972 / 972 בהתחלה → 0 (מספר ישראלי מקומי); משאירים 10 ספרות.
        private static string NormalizePhone(string? phone)
        {
            if (string.IsNullOrWhiteSpace(phone)) return string.Empty;
            var digits = new string(phone.Where(char.IsDigit).ToArray());
            if (digits.StartsWith("972")) digits = "0" + digits[3..];
            return digits;
        }
    }
}
