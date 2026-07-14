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
        public DateOnly? BirthDate { get; set; }

        /* ── שדות נוספים מקובץ משרד החינוך (כולם אופציונליים) ────────────
           נאספים בייבוא הקובץ הרשמי; ניתן להשלים/לתקן בעריכת התלמיד. */
        public string IdNumber { get; set; } = string.Empty;        // תעודת זהות
        public string Gender { get; set; } = string.Empty;          // מין
        public string Allergies { get; set; } = string.Empty;       // אלרגיות
        public string Address { get; set; } = string.Empty;         // רחוב + בית + דירה
        public string ParentEmail { get; set; } = string.Empty;     // דוא"ל הורה א'
        public string ParentBName { get; set; } = string.Empty;     // שם הורה ב'
        public string ParentBPhone { get; set; } = string.Empty;    // טלפון הורה ב'
        public string ParentBEmail { get; set; } = string.Empty;    // דוא"ל הורה ב'
        public string ParentsMarried { get; set; } = string.Empty;  // האם ההורים נשואים

        // קשר אופציונלי לגן (Group) — תלמיד ישויך לגן שהוגדר באשף ההרשמה
        public int? GroupId { get; set; }
        public Group? Group { get; set; }
    }
}
