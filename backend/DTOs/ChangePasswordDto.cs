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
        [StringLength(100, MinimumLength = 8, ErrorMessage = "הסיסמה חייבת להכיל לפחות 8 תווים")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
