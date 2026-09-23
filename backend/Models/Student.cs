namespace ParentCommitteeAPI.Models
{
    public class Student
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;

        /* שם ההורה (אופציונלי) — נאסף בייבוא מקובץ ובטופס התלמיד */
        public string ParentName { get; set; } = string.Empty;

        public string ParentPhoneNumber { get; set; } = string.Empty;
        public int Grade { get; set; }
        public string ClassName { get; set; } = string.Empty;

        /* תאריך לידה (אופציונלי) — להצגת יום ההולדת ברשימת התלמידים */
/*
          יום וחודש בלבד — **שנת הלידה אינה נשמרת** (מזעור נתונים, בדיקת
          הפרטיות 23.09.2026). השימוש היחיד הוא ברכת יום הולדת, ולשם כך שנת
          הלידה מיותרת — והיא הנתון שהופך תאריך לידה למזהה אישי.

          הערך נשמר עם שנת-דמה קבועה (BirthYearPlaceholder) כדי לא להחליף את
          סוג העמודה ואת כל מה שנשען עליה; כל כתיבה מנרמלת אליה, ומיגרציה
          שכתבה גם את הרשומות הישנות.
        */
        public const int BirthYearPlaceholder = 2000;

        public DateOnly? BirthDate { get; set; }

        /* ── שדות נוספים מקובץ משרד החינוך (כולם אופציונליים) ────────────
           נאספים בייבוא הקובץ הרשמי; ניתן להשלים/לתקן בעריכת התלמיד. */
        public string Gender { get; set; } = string.Empty;          // מין
        public string Allergies { get; set; } = string.Empty;       // אלרגיות
        public string ParentEmail { get; set; } = string.Empty;     // דוא"ל הורה א'
        public string ParentBName { get; set; } = string.Empty;     // שם הורה ב'
        public string ParentBPhone { get; set; } = string.Empty;    // טלפון הורה ב'
        public string ParentBEmail { get; set; } = string.Empty;    // דוא"ל הורה ב'

        // קשר אופציונלי לגן (Group) — תלמיד ישויך לגן שהוגדר באשף ההרשמה
        public int? GroupId { get; set; }
        public Group? Group { get; set; }
    }
}
