namespace ParentCommitteeAPI.DTOs
{
    /*
      StudentResponseDto — מה שחוזר ללקוח. לעולם לא מחזירים את מודל המסד עצמו,
      כדי שהלקוח לא יכיר את מבנה המסד ונוכל לשנות אותו בחופשיות.
    */
    public class StudentResponseDto
    {
        public int Id { get; set; }
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string ParentName { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string ParentPhoneNumber { get; set; } = string.Empty;

        /* תאריך לידה (אופציונלי) — להצגת יום ההולדת ברשימה */
        public DateOnly? BirthDate { get; set; }

        /* ── שדות נוספים מקובץ משרד החינוך ──────────────────────────── */
        public string IdNumber { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public string Allergies { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string ParentEmail { get; set; } = string.Empty;
        public string ParentBName { get; set; } = string.Empty;
        public string ParentBPhone { get; set; } = string.Empty;
        public string ParentBEmail { get; set; } = string.Empty;
        public string ParentsMarried { get; set; } = string.Empty;

        /* סך התשלומים ששולמו עד כה — מחושב בשרת מהתשלומים, לא נשמר במסד */
        public decimal TotalPaid { get; set; }
    }
}
