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
          מבצע פתיחה: **הפרו פתוח לכולם ללא עלות עד 1.10.2026** (החלטת בעלת
          המוצר 26.08.2026) — הוועדים נכנסו למערכת רק עכשיו, ותקופת ניסיון
          שנגמרת באמצע ההיערכות לשנת הלימודים הייתה נועלת פיצ'רים בדיוק ברגע
          הכי עמוס שלהם.

          מיושם כרצפה ולא כדריסה: מי שתקופת הניסיון האישית שלו/ה נמשכת מעבר
          לתאריך הזה (למשל הרשמה ב-20.9) שומר/ת עליה במלואה.
        */
        public static readonly DateTime PromoFreeProUntil =
            new(2026, 10, 1, 0, 0, 0, DateTimeKind.Utc);

        /*
          מתי הפרו החינמי נגמר בפועל — המאוחר מבין הניסיון האישי למבצע.
          מקור אחד לתאריך: גם האכיפה וגם מה שמוצג למשתמשת נגזרים ממנו, ולכן
          אי אפשר שהבאנר יבטיח תאריך אחד והמערכת תנעל באחר.
        */
        public static DateTime EffectiveTrialEnd(DateTime? trialUntil)
        {
            var personal = trialUntil ?? DateTime.MinValue;
            return personal > PromoFreeProUntil ? personal : PromoFreeProUntil;
        }

        /*
          האם תקופת הניסיון של בעל/ת החשבון עדיין פעילה.

          מודל התמחור (החלטת בעלת המוצר 22.08.2026): חודש ראשון מההרשמה —
          **כל פיצ'רי הפרו פתוחים**. בסופו המשתמשת אינה נחסמת אלא **עוברת
          למסלול החינמי**, ומה שיצרה בתקופת הניסיון נשמר במלואו.

          trialUntil הוא `User.SubscriptionValidUntil` של בעל/ת הגן.
        */
        public static bool IsTrialActive(DateTime? trialUntil) =>
            EffectiveTrialEnd(trialUntil).Date >= DateTime.UtcNow.Date;

        /*
          האם לגן יש פיצ'רי פרו פעילים כרגע — בתשלום או בזכות הניסיון.
          זהו הכלל היחיד שנבדק בכל נקודות האכיפה.
        */
        public static bool IsActive(Group? group, DateTime? ownerTrialUntil = null) =>
            IsPurchased(group) || IsTrialActive(ownerTrialUntil);
    }
}
