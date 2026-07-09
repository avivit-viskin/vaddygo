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

        // קשר אופציונלי לגן (Group) — תלמיד ישויך לגן שהוגדר באשף ההרשמה
        public int? GroupId { get; set; }
        public Group? Group { get; set; }
    }
}
