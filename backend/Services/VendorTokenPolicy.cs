using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      VendorTokenPolicy — הכלל היחיד לתוקף קישור העריכה של הספק.

      הקישור נשלח בוואטסאפ ומעניק גישה מלאה לכרטיס. הודעה שמועברת הלאה, טלפון
      שאבד, או צילום מסך — כולם מעבירים את הגישה. לכן לקישור יש חלון זמן.

      איך זה לא תוקע ספק אמיתי:
      • ספק שהגדיר מייל+סיסמה — כל התחברות מנפיקה חלון חדש (ראו LoginAsync).
      • ספק שעדיין לא הגדיר — מבקש מהמנהלת קישור חדש; היא מפיקה אותו בלחיצה,
        וזה גם **מבטל את הקישור הישן**.

      טוקן בלי חותמת הנפקה (רשומות שנוצרו לפני שהשדה נוסף) נחשב **פג** —
      פייל-קלוז'ד. המיגרציה מעניקה להם חותמת בזמן העלייה, כך שאף ספק קיים לא
      נחסם בפועל, אבל אם רשומה כזו תיווצר בעתיד היא לא תיפתח בטעות לנצח.
    */
    public static class VendorTokenPolicy
    {
        /* ברירת מחדל: 30 יום. ניתן לשינוי ב-Vendors:EditTokenDays. */
        public const int DefaultDays = 30;

        public static bool IsValid(Vendor? vendor, int days)
        {
            if (vendor == null || string.IsNullOrEmpty(vendor.EditToken))
            {
                return false;
            }
            if (vendor.EditTokenIssuedAt == null)
            {
                return false;
            }
            return vendor.EditTokenIssuedAt.Value.AddDays(days) >= DateTime.UtcNow;
        }
    }
}
