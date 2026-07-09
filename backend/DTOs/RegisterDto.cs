using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      RegisterDto — פרטי יצירת מנוי בעת הרכישה (UI_SPEC ס' 2):
      שם משתמש, מייל וסיסמה שהלקוח בוחר לעצמו.
    */
    public class RegisterDto
    {
        [Required(ErrorMessage = "שם משתמש הוא שדה חובה")]
        [StringLength(30, MinimumLength = 3, ErrorMessage = "שם המשתמש חייב להכיל בין 3 ל-30 תווים")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "כתובת מייל היא שדה חובה")]
        [EmailAddress(ErrorMessage = "כתובת המייל אינה תקינה")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "סיסמה היא שדה חובה")]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "הסיסמה חייבת להכיל לפחות 6 תווים")]
        public string Password { get; set; } = string.Empty;
    }
}
