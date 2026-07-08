namespace ParentCommitteeAPI.Models
{
    /*
      StaffMember — איש/אשת צוות של הגן (גננת, סייעת...), לפי מסך הבית (UI_SPEC ס' 8):
      רשימת ימי הולדת קרובים של הצוות + הוספה ועריכה.
    */
    public class StaffMember
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;

        /* תאריך לידה — נשמר כתאריך בלבד; ההתראות נגזרות ממנו בשרת */
        public DateTime BirthDate { get; set; }

        // קשר אופציונלי לגן שהוגדר באשף ההרשמה
        public int? GroupId { get; set; }
        public Group? Group { get; set; }
    }
}
