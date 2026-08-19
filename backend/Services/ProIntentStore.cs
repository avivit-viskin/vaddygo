using System.Collections.Concurrent;

namespace ParentCommitteeAPI.Services
{
    /*
      ProIntentStore — "רישום כוונת רכישה" זמני בזיכרון.

      הבעיה: קישורי התשלום של GROW הם סטטיים ומשותפים, ו-GROW לא מחזיר ב-webhook
      את המזהים שהוספנו לקישור (cField). בתשלום ApplePay גם המייל חוזר ריק. לכן,
      כשמגיע אישור תשלום, אין בו דבר שמזהה איזה גן/ספק שילם.

      הפתרון: ברגע שהמשתמש/ת לוחצים "תשלום", האפליקציה מודיעה לשרת מי עומד לשלם
      (groupId לוועד / vendorId לספק). אנחנו שומרים את זה כאן לזמן קצר; כשה-webhook
      מגיע (שניות-דקות אחר כך) אנחנו לוקחים את הכוונה האחרונה המתאימה ומדליקים לה פרו.

      למה בזיכרון ולא ב-DB: Railway מריץ replica יחיד, החלון בין הלחיצה לתשלום קצר
      (דקות), ואין כאן נתון שחייב לשרוד אתחול שרת. כך נמנעים ממיגרציה על ה-DB החי.
      אם השרת מאותחל בדיוק באמצע תשלום — הכוונה תאבד ונופלים לזיהוי לפי טלפון/מייל,
      או שהמנהלת מדליקה ידנית (ProTestControl). מספיק לשלב הנוכחי.
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
        void Record(ProIntent intent);

        /* מחזיר ומסיר את הכוונה האחרונה מהסוג המבוקש שנרשמה בתוך החלון (אחרת null). */
        ProIntent? TakeMostRecent(ProIntentKind kind, TimeSpan within);
    }

    public class ProIntentStore : IProIntentStore
    {
        // רשימה משותפת בזיכרון — נעילה קצרה סביב הגישה כדי שקריאות מקבילות (לחיצה
        // מול webhook) לא יתנגשו. גודל זניח (כוונות בודדות שחיות דקות).
        private readonly List<ProIntent> _intents = new();
        private readonly object _lock = new();

        public void Record(ProIntent intent)
        {
            lock (_lock)
            {
                _intents.Add(intent);
                // ניקוי כוונות ישנות מ-2 שעות — שלא ייצברו לנצח.
                var cutoff = intent.CreatedAt.AddHours(-2);
                _intents.RemoveAll(i => i.CreatedAt < cutoff);
            }
        }

        public ProIntent? TakeMostRecent(ProIntentKind kind, TimeSpan within)
        {
            lock (_lock)
            {
                // האחרונה שנרשמה מהסוג המבוקש ועדיין בתוך החלון.
                ProIntent? best = null;
                foreach (var i in _intents)
                {
                    if (i.Kind != kind) continue;
                    if (best == null || i.CreatedAt > best.CreatedAt) best = i;
                }
                if (best == null) return null;
                // מחוץ לחלון — לא מתאים (ומנקים אותה, כבר לא רלוונטית).
                if (DateTime.UtcNow - best.CreatedAt > within)
                {
                    _intents.Remove(best);
                    return null;
                }
                _intents.Remove(best); // נצרכת פעם אחת
                return best;
            }
        }
    }
}
