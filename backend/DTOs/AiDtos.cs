using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      AiAskDto — בקשה לעוזרת ה-AI. Context הוא רקע כללי לא-מזהה (למשל סיכום גבייה
      במספרים) שהלקוח בוחר לצרף; לעולם לא שולחים דרכו שמות/טלפונים של ילדים או הורים.
    */
    public class AiAskDto
    {
        [Required(ErrorMessage = "מה תרצי לשאול?")]
        [StringLength(2000, ErrorMessage = "השאלה יכולה להכיל עד 2000 תווים")]
        public string Question { get; set; } = string.Empty;

        [StringLength(2000, ErrorMessage = "הרקע יכול להכיל עד 2000 תווים")]
        public string? Context { get; set; }
    }

    public class AiResponseDto
    {
        public string Answer { get; set; } = string.Empty;
    }
}
