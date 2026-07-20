using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      DTOs לאיפוס סיסמה (UI_SPEC ס' 2):
      ForgotPasswordDto — שלב 1: בקשת קוד למייל.
      ResetPasswordDto  — שלב 2: הזנת הקוד שהתקבל + סיסמה חדשה.
    */
    public class ForgotPasswordDto
    {
        [Required(ErrorMessage = "כתובת מייל היא שדה חובה")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        public string Email { get; set; } = string.Empty;
    }

    public class ResetPasswordDto
    {
        [Required(ErrorMessage = "כתובת מייל היא שדה חובה")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "צריך להזין את הקוד שהתקבל במייל")]
        public string Code { get; set; } = string.Empty;

        [Required(ErrorMessage = "סיסמה חדשה היא שדה חובה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל לפחות 6 תווים")]
        public string NewPassword { get; set; } = string.Empty;
    }
}
