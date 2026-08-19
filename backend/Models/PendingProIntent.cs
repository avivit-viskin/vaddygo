using System;

namespace ParentCommitteeAPI.Models
{
    /*
      PendingProIntent — "כוונת רכישת פרו" שנרשמת ברגע שמשתמש/ת לוחצים "תשלום",
      לפני המעבר ל-GROW. כשאישור התשלום (webhook) מגיע — GROW לא מחזיר את מזהה הגן/ספק
      ובתשלום ApplePay גם המייל ריק — אנחנו מתאימים אותו לכוונה האחרונה מהסוג המתאים
      ומדליקים פרו.

      נשמר ב-DB (ולא בזיכרון) כי כל פריסה של קוד מאתחלת את השרת ומוחקת זיכרון —
      והחלון בין הלחיצה לאישור התשלום עלול לחצות פריסה. ב-DB זה שורד אתחול.
    */
    public class PendingProIntent
    {
        public int Id { get; set; }

        // "committee" | "supplier"
        public string Kind { get; set; } = "committee";

        // מזהה היעד המדויק שנבחר באפליקציה (אחד מהם, לפי הסוג)
        public int? GroupId { get; set; }
        public int? VendorId { get; set; }

        // גיבוי לזיהוי אם אין מזהה מפורש
        public string? Email { get; set; }
        public string? Phone { get; set; }

        public DateTime CreatedAt { get; set; }

        // מסומן כשנצרך ע"י webhook — כדי לא לצרוך אותו פעמיים (retry של GROW)
        public DateTime? ConsumedAt { get; set; }
    }
}
