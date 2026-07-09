using System.ComponentModel.DataAnnotations;

namespace ParentCommitteeAPI.DTOs
{
    /*
      LoginDto — כניסה עם שם משתמש (או מייל) + סיסמה (UI_SPEC ס' 2).
    */
    public class LoginDto
    {
        [Required(ErrorMessage = "יש להזין שם משתמש או מייל")]
        public string UsernameOrEmail { get; set; } = string.Empty;

        [Required(ErrorMessage = "יש להזין סיסמה")]
        public string Password { get; set; } = string.Empty;
    }
}
