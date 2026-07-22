namespace ParentCommitteeAPI.Models
{
    /*
      GroupMember — חברוּת של משתמש *מוזמן* בגן, עם הרשאה. הבעלים של הגן
      (Group.UserId) הוא תמיד "מנהל" מרומז ואינו נשמר כאן; רשומות אלה מייצגות
      את המשתמשים הנוספים שהוזמנו והצטרפו.
      Role: "viewer" (צפייה בלבד) | "editor" (צפייה ועריכה) | "manager" (הכול,
      כולל הזמנה/הסרה של משתמשים).
    */
    public class GroupMember
    {
        public int Id { get; set; }
        public int GroupId { get; set; }
        public int UserId { get; set; }
        public string Role { get; set; } = "viewer";
        public DateTime JoinedAt { get; set; }
    }
}
