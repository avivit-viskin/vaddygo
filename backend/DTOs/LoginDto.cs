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

        /*
          אסימון "זכור את המכשיר הזה" מכניסה קודמת, אם קיים. נשלח מהדפדפן
          ופוטר מהקוד החד-פעמי כל עוד הוא בתוקף. לא חובה, ולא אמצעי הזדהות
          בפני עצמו — הסיסמה עדיין נדרשת.
        */
        public string? DeviceToken { get; set; }
    }
}
