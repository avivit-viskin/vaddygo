namespace ParentCommitteeAPI.Models
{
    /*
      Vendor — ספק של הוועד (UI_SPEC ס' 12). ספקים מנוהלים ידנית על ידי מנהלת
      VaddyGo כערוץ הכנסה (ספקים בתשלום). לכל ספק: מוצרים (עם תמונות), קישור
      וואטסאפ, וקישורים לרשתות חברתיות. אגרגט — המוצרים והקישורים (Owned)
      נטענים ונשמרים תמיד יחד עם הספק.
    */
    public class Vendor
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CatalogUrl { get; set; } = string.Empty;

        /* קטגוריה (הזנה/חוגים/מתנות/אירועים/ציוד/אחר) ועיר/אזור פעילות — כדי
           שוועדים יוכלו לסנן ולמצוא ספקים מתאימים (גילוי). ריק = לא הוגדר. */
        public string Category { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;

        /* אמצעי התשלום של הספק — לתשלום ישיר מהוועד אליו (VaddyGo לא מחזיקה כסף).
           כולם אופציונליים: קישור תשלום (GROW/פייבוקס/כל קישור), ביט, והעברה בנקאית. */
        public string PaymentLink { get; set; } = string.Empty;
        public string PaymentBit { get; set; } = string.Empty;
        public string PaymentBankInfo { get; set; } = string.Empty;

        /* עד כמה תשלומים הספק מאפשר לפרוס (0/1 = תשלום אחד). הוועד רואה זאת
           ליד כפתור התשלום; הפריסה בפועל מתבצעת בעמוד התשלום של הספק. */
        public int PaymentInstallments { get; set; }

        /* טוקן עריכה אישי — מאפשר לספק לערוך את הכרטיס שלו דרך קישור, בלי חשבון.
           ריק עד שמייצרים קישור; GUID לא-ניתן-לניחוש הוא אמצעי הזיהוי. */
        public string EditToken { get; set; } = string.Empty;

        /* התחברות ספק (אופציונלי): הספק מגדיר מייל+סיסמה כדי לחזור בלי הקישור.
           ההתחברות מאמתת מול אלה ומחזירה את EditToken. PasswordHash = PBKDF2. */
        public string LoginEmail { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;

        /* איפוס סיסמה לספק (כמו למנוי) — קוד חד-פעמי מגובב, תוקף, ומונה ניסיונות.
           null כשאין תהליך איפוס פעיל; מתאפס אחרי איפוס מוצלח או 5 ניסיונות שגויים. */
        public string? ResetCodeHash { get; set; }
        public DateTime? ResetCodeExpiresAt { get; set; }
        public int ResetCodeAttempts { get; set; }

        /* מספר טלפון או קישור וואטסאפ של הספק — בלקוח נבנה ממנו כפתור wa.me */
        public string WhatsApp { get; set; } = string.Empty;

        public List<VendorProduct> Products { get; set; } = new();
        public List<VendorSocialLink> SocialLinks { get; set; } = new();
    }
}
