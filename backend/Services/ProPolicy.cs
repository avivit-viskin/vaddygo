using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      ProPolicy — הכלל היחיד שקובע האם למוסד יש מסלול פרו **פעיל** כרגע.

      מרוכז במקום אחד בכוונה: הדגל נבדק בכמה מקומות (חסימת פיצ'רים, מה שמוחזר
      ללקוח, מסך המנהלת), ואם כל אחד יחשב בעצמו — מוסד יוכל להיראות מנוי במקום
      אחד ולא-מנוי באחר.

      פרו פעיל = הדגל דלוק **וגם** התוקף לא עבר. תוקף null = בלי תאריך תפוגה
      (פתיחה ידנית של המנהלת), ולכן נחשב פעיל.
    */
    public static class ProPolicy
    {
        /* פרו שנרכש או שנפתח ידנית — בלי קשר לתקופת הניסיון. */
        public static bool IsPurchased(Group? group)
        {
            if (group == null || !group.IsPro)
            {
                return false;
            }
            // התוקף הוא "עד סוף היום" — משווים לפי תאריך, לא לפי שעה, כדי שמנוי
            // שתקף "עד 10.08" לא ייסגר בבוקר של אותו יום.
            return group.ProValidUntil == null
                || group.ProValidUntil.Value.Date >= DateTime.UtcNow.Date;
        }

        /*
          מבצע פתיחה: **הפרו פתוח לכולם ללא עלות עד 1.10.2026**, ו**נסגר לכולם
          באותו יום** למי שלא רכש (החלטת בעלת המוצר 26.08.2026).

          התאריך הוא **סוף קשיח ולא רצפה** — עדכון להחלטה קודמת מאותו יום, שבה
          תקופת ניסיון אישית ארוכה יותר הייתה גוברת. הכוונה העסקית היא מועד
          אחד שבו כולם עוברים יחד למסלול החינמי, ולא זנב של תאריכים שנמשך
          לתוך אוקטובר.
        */
        public static readonly DateTime PromoFreeProUntil =
            new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        /*
          **הרגע המדויק** שבו הפרו החינמי נסגר: חצות של 1.10 **בשעון ישראל**,
          שהם 30.09 בשעה 21:00 UTC.

          🔴 למה זה נכתב כרגע מדויק ולא כהשוואת תאריכים: ההשוואה הקודמת הייתה
          "תאריך הסיום גדול-או-שווה לתאריך של היום ב-UTC", ולכן הפרו היה נשאר
          פתוח **כל יום ה-1.10** ונסגר רק ב-2.10 בשעה 03:00 שעון ישראל — כ-51
          שעות אחרי הכוונה. שתי סיבות הצטברו: ה-greater-or-equal נתן יום שלם
          נוסף, והשוואה לפי תאריך UTC הזיזה את הרגע בשלוש שעות נוספות.

          כתיבה כרגע אחד פותרת את שניהם, ואינה תלויה בהתקנת אזורי-זמן בשרת:
          ב-1.10 ישראל היא UTC+3 (שעון הקיץ מסתיים רק בסוף אוקטובר).
        */
        public static readonly DateTime PromoEndsAtUtc =
            new(2026, 9, 30, 21, 0, 0, DateTimeKind.Utc);

        /*
          מתי הפרו החינמי נגמר בפועל.

          הכלל תלוי ב**מועד ההרשמה** ולא באורך הניסיון:
          • נרשם/ה לפני 1.10 → הפרו נגמר **בדיוק ב-1.10**. זה גם מאריך למי
            שהניסיון האישי שלו כבר פג, וגם מקצר למי שנרשם/ה בסוף ספטמבר.
          • נרשם/ה אחרי 1.10 → חוזרים למודל הרגיל: חודש מההרשמה. בלי זה
            לקוחה חדשה בנובמבר הייתה נכנסת בלי שום תקופת ניסיון.

          מקור אחד לתאריך: גם האכיפה וגם מה שמוצג בבאנר נגזרים מכאן, ולכן אי
          אפשר שהבאנר יבטיח תאריך אחד והמערכת תנעל באחר.
        */
        public static DateTime EffectiveTrialEnd(DateTime? trialUntil, DateTime? registeredAt)
        {
            if (registeredAt == null || registeredAt.Value.Date <= PromoFreeProUntil.Date)
            {
                return PromoFreeProUntil;
            }
            return trialUntil ?? DateTime.MinValue;
        }

        /*
          האם תקופת הניסיון של בעל/ת החשבון עדיין פעילה.

          מודל התמחור (החלטת בעלת המוצר 22.08.2026): חודש ראשון מההרשמה —
          **כל פיצ'רי הפרו פתוחים**. בסופו המשתמשת אינה נחסמת אלא **עוברת
          למסלול החינמי**, ומה שיצרה בתקופת הניסיון נשמר במלואו.

          trialUntil הוא `User.SubscriptionValidUntil` של בעל/ת הגן.
        */
        public static bool IsTrialActive(DateTime? trialUntil, DateTime? registeredAt)
        {
            var end = EffectiveTrialEnd(trialUntil, registeredAt);

            // המבצע נסגר ברגע מדויק (חצות 1.10 בישראל) — ראו PromoEndsAtUtc.
            if (end == PromoFreeProUntil)
            {
                return DateTime.UtcNow < PromoEndsAtUtc;
            }

            // ניסיון אישי רגיל (נרשמו אחרי 1.10) — נשאר לפי יום, "עד סוף היום".
            return end.Date >= DateTime.UtcNow.Date;
        }

        /*
          האם לגן יש פיצ'רי פרו פעילים כרגע — בתשלום או בזכות הניסיון.
          זהו הכלל היחיד שנבדק בכל נקודות האכיפה.
        */
        public static bool IsActive(
            Group? group, DateTime? ownerTrialUntil, DateTime? ownerRegisteredAt) =>
            IsPurchased(group) || IsTrialActive(ownerTrialUntil, ownerRegisteredAt);
    }
}
