using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      VendorProPolicy — הכלל היחיד שקובע האם לספק יש מסלול פרו **פעיל** כרגע.
      מקביל ל-ProPolicy של הגן (מקור אמת אחד, כדי שספק לא ייראה מנוי במקום אחד
      ולא-מנוי באחר).

      פרו פעיל = נרכש **או** פתוח במסגרת המבצע. שני המצבים נשמרים נפרדים
      בכוונה: הפיצ'רים נפתחים לשניהם, אבל "מי משלם לי" ו"למי להציג באנר מבצע"
      הן שאלות אחרות לגמרי.
    */
    public static class VendorProPolicy
    {
        /* פרו שנרכש או שנפתח ידנית ע"י המנהלת — בלי קשר למבצע. */
        public static bool IsPurchased(Vendor? vendor)
        {
            if (vendor == null || !vendor.IsPro)
            {
                return false;
            }
            // התוקף "עד סוף היום" — משווים לפי תאריך (לא שעה), כדי שמנוי שתקף
            // "עד 30.8" לא ייסגר בבוקר של אותו יום.
            return vendor.ProValidUntil == null
                || vendor.ProValidUntil.Value.Date >= DateTime.UtcNow.Date;
        }

        /*
          מבצע פתיחה לספקים — **פרו פתוח לכל הספקים ללא עלות עד 1.10.2026**
          (החלטת בעלת המוצר 02.09.2026), בדיוק כמו לוועדים.

          התאריך נלקח מ-ProPolicy ולא נכתב כאן שוב: שני הצדדים חייבים להיסגר
          באותו יום, ותאריך משוכפל הוא תאריך שיישכח באחד המקומות.
        */
        public static DateTime PromoFreeProUntil => ProPolicy.PromoFreeProUntil;

        /*
          מתי הפרו החינמי של הספק נגמר.

          תלוי במועד ההצטרפות, כמו אצל הוועדים:
          • הצטרף לפני 1.10 (או שאין תאריך — ספק ותיק) → נגמר **ב-1.10**.
          • הצטרף אחרי 1.10 → אין מבצע. ספק חדש בנובמבר נכנס למודל הרגיל.
        */
        public static DateTime EffectiveTrialEnd(DateTime? createdAt) =>
            createdAt == null || createdAt.Value.Date <= PromoFreeProUntil.Date
                ? PromoFreeProUntil
                : DateTime.MinValue;

        /* הספק נהנה כרגע מפרו ללא עלות (ולא ממנוי בתשלום). */
        public static bool IsTrialActive(DateTime? createdAt) =>
            EffectiveTrialEnd(createdAt).Date >= DateTime.UtcNow.Date;

        /* פרו פעיל בפועל — נרכש או מבצע. זה מה שפותח את הפיצ'רים. */
        public static bool IsActive(Vendor? vendor) =>
            IsPurchased(vendor) || (vendor != null && IsTrialActive(vendor.CreatedAt));
    }
}
