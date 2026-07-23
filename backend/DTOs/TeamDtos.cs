using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      DTOs לניהול הצוות וההרשאות: הזמנה דרך קישור, רשימת חברים והזמנות ממתינות,
      ופעולות מנהל (הזמנה/שינוי הרשאה/הסרה). Role: viewer | editor | manager.
    */
    public class InviteCreateDto
    {
        [Required(ErrorMessage = "יש לבחור הרשאה")]
        public string Role { get; set; } = "viewer";

        [StringLength(80, ErrorMessage = "השם יכול להכיל עד 80 תווים")]
        public string? Name { get; set; }
    }

    public class RoleUpdateDto
    {
        [Required(ErrorMessage = "יש לבחור הרשאה")]
        public string Role { get; set; } = "viewer";
    }

    /* מוחזר בעת יצירת הזמנה — הטוקן משמש לבניית קישור ההזמנה בצד הלקוח */
    public class InviteResponseDto
    {
        public int Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string InviteeName { get; set; } = string.Empty;
    }

    public class TeamMemberDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }

    public class PendingInviteDto
    {
        public int Id { get; set; }
        public string Token { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string InviteeName { get; set; } = string.Empty;

        // האם ההזמנה כבר אושרה (מישהו הצטרף איתה). כך היא נשארת ברשימה כ"אושר"
        // במקום להיעלם — המזמין רואה שהבקשה שלו אושרה.
        public bool Approved { get; set; }
    }

    public class TeamResponseDto
    {
        public List<TeamMemberDto> Members { get; set; } = new();
        public List<PendingInviteDto> PendingInvites { get; set; } = new();

        /* האם המשתמש הנוכחי רשאי לנהל את הצוות (מנהל) — לשליטה בכפתורים בצד הלקוח */
        public bool CanManage { get; set; }
    }

    /* תצוגה מקדימה של הזמנה בעמוד ההצטרפות (לפי הטוקן) */
    public class InvitePreviewDto
    {
        public int GanId { get; set; }
        public string GanName { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool AlreadyMember { get; set; }

        // ההזמנה כבר נוצלה על ידי מישהו אחר (משתמש חדש לא יכול להצטרף איתה)
        public bool Used { get; set; }
    }
}
