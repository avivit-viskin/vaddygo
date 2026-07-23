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

    /*
      AccessDto — פריט אחד ברשימת ה"גישות" המאוחדת: אדם שיש לו גישה לגן, או
      בקשה שנשלחה וטרם אושרה. שדות רלוונטיים לפי המצב:
      - Approved=false (טרם אושר): Token + InviteId (לשיתוף/ביטול ההזמנה).
      - Approved=true (אושר/חבר): MemberId (לשינוי הרשאה/הסרה).
      Name = השם שהוזן בהזמנה, או שם המשתמש (לחבר ללא הזמנה מקושרת).
    */
    public class AccessDto
    {
        public string Name { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool Approved { get; set; }
        public int? InviteId { get; set; }
        public string? Token { get; set; }
        public int? MemberId { get; set; }
    }

    public class TeamResponseDto
    {
        /* רשימת גישות מאוחדת (חברים + בקשות ממתינות), ממתינות ראשונות. */
        public List<AccessDto> Accesses { get; set; } = new();

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
