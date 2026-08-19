using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      ProIntentStore — "רישום כוונת רכישה" השורד אתחולי שרת (נשמר ב-DB).

      הבעיה: קישורי התשלום של GROW סטטיים ומשותפים, ו-GROW לא מחזיר ב-webhook את
      המזהים שהוספנו לקישור (cField). בתשלום ApplePay גם המייל חוזר ריק. לכן, כשמגיע
      אישור תשלום, אין בו דבר שמזהה איזה גן/ספק שילם.

      הפתרון: ברגע שלוחצים "תשלום", האפליקציה מודיעה לשרת מי עומד לשלם (groupId/vendorId).
      שומרים כשורה ב-DB; כשה-webhook מגיע (שניות-דקות אחר כך) לוקחים את הכוונה האחרונה
      המתאימה ומדליקים לה פרו.

      למה ב-DB ולא בזיכרון: כל דחיפת קוד מפרסת מחדש ומאתחלת את השרת (מוחקת זיכרון),
      והחלון בין הלחיצה לאישור עלול לחצות פריסה. ב-DB זה שורד. הטבלה קטנה ומתנקה
      מעצמה (כוונות שנצרכו/ישנות נמחקות).
    */
    public enum ProIntentKind { Committee, Supplier }

    public record ProIntent(
        ProIntentKind Kind,
        int? GroupId,
        int? VendorId,
        string? Email,
        string? Phone,
        DateTime CreatedAt);

    public interface IProIntentStore
    {
        Task RecordAsync(ProIntent intent);

        /* מחזיר ומסמן-כנצרך את הכוונה האחרונה מהסוג המבוקש שנרשמה בתוך החלון (אחרת null). */
        Task<ProIntent?> TakeMostRecentAsync(ProIntentKind kind, TimeSpan within);
    }

    public class ProIntentStore : IProIntentStore
    {
        private readonly AppDbContext _db;

        public ProIntentStore(AppDbContext db)
        {
            _db = db;
        }

        private static string KindToString(ProIntentKind k) =>
            k == ProIntentKind.Supplier ? "supplier" : "committee";

        public async Task RecordAsync(ProIntent intent)
        {
            _db.PendingProIntents.Add(new PendingProIntent
            {
                Kind = KindToString(intent.Kind),
                GroupId = intent.GroupId,
                VendorId = intent.VendorId,
                Email = intent.Email,
                Phone = intent.Phone,
                CreatedAt = intent.CreatedAt,
            });

            // ניקוי כוונות ישנות מ-6 שעות — שלא ייצברו לנצח.
            var cutoff = DateTime.UtcNow.AddHours(-6);
            var stale = await _db.PendingProIntents
                .Where(i => i.CreatedAt < cutoff)
                .ToListAsync();
            if (stale.Count > 0) _db.PendingProIntents.RemoveRange(stale);

            await _db.SaveChangesAsync();
        }

        public async Task<ProIntent?> TakeMostRecentAsync(ProIntentKind kind, TimeSpan within)
        {
            var kindStr = KindToString(kind);
            var since = DateTime.UtcNow - within;

            var row = await _db.PendingProIntents
                .Where(i => i.Kind == kindStr && i.ConsumedAt == null && i.CreatedAt >= since)
                .OrderByDescending(i => i.CreatedAt)
                .FirstOrDefaultAsync();

            if (row == null) return null;

            // סימון כנצרך (ולא מחיקה) — כדי ש-retry של GROW לא יתאים אותו שוב.
            row.ConsumedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return new ProIntent(kind, row.GroupId, row.VendorId, row.Email, row.Phone, row.CreatedAt);
        }
    }
}
