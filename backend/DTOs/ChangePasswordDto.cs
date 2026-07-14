using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      ChangePasswordDto — שינוי סיסמה למשתמש מחובר: הסיסמה הנוכחית (לאימות)
      והסיסמה החדשה. אותה מדיניות אורך כמו בהרשמה.
    */
    public class ChangePasswordDto
    {
        [Required(ErrorMessage = "יש להזין את הסיסמה הנוכחית")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "יש להזין סיסמה חדשה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל לפחות 6 תווים")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
