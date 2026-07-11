namespace ParentCommitteeAPI.Models
{
    /*
      Group — הגן/בית הספר שהוועד מנהל, כפי שמוגדר באשף ההרשמה (UI_SPEC ס' 3-6).
      Subgroups נשמר כמחרוזת מופרדת בפסיקים (למשל "תינוקייה,פעוטות") —
      החלטה מודעת (KISS): לקבוצות אין עדיין התנהגות משלהן; אם תהיה, ינורמלו לטבלה.
    */
    public class Group
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;

        /* שנת הלימודים לפי השנה הלועזית שבה היא נפתחת בספטמבר (2026 = תשפ"ז).
           לא נאסף באשף — נקבע בשרת לפי התאריך; מוצג בכותרת מסך הבית. */
        public int Year { get; set; }

        public int ChildrenCount { get; set; }
        public int StaffCount { get; set; }
        public string Subgroups { get; set; } = string.Empty;

        // קישורי התשלום של הוועד (ביט + קבוצת פייבוקס) — משותפים לכל חברות הוועד.
        // נשמרים ברמת הגן כדי שכולן יראו את אותם קישורים; משמשים את "בקשת תשלום".
        public string? BitLink { get; set; }
        public string? PayboxLink { get; set; }

        // תקציבי החגים של הוועד (מפתח "שם|שנה עברית" → סכום) כ-JSON — משותפים לכל
        // החברות; מוגדרים בלוח השנה ומשמשים גם את העוזרת התקציבית במסך המתנות.
        public string? HolidayBudgetsJson { get; set; }

        // קטגוריות הגבייה של הגן (הזנה, דמי ועד...) — יעד הגבייה נגזר מהן
        public List<CollectionCategory> Categories { get; set; } = new();
    }
}
