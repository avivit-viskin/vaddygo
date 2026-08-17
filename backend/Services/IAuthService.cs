using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      תוצאת הרשמה/כניסה. שלוש אפשרויות בלבד, וכל אחת שוללת את השתיים האחרות:
      הצלחה (Response), כישלון (Error), או "הסיסמה נכונה אבל צריך קוד"
      (TwoFactor) — מצב שבו עדיין **אין טוקן**, כי הכניסה לא הושלמה.
    */
    public record AuthResult(
        AuthResponseDto? Response, string? Error, TwoFactorRequiredDto? TwoFactor = null);

    public interface IAuthService
    {
        Task<AuthResult> RegisterAsync(RegisterDto dto);
        Task<AuthResult> LoginAsync(LoginDto dto);
        Task<AuthResult> LoginWithGoogleAsync(GoogleLoginDto dto);

        /* שינוי סיסמה למשתמש המחובר (userId מה-JWT). מחזיר הודעת שגיאה או null בהצלחה. */
        Task<string?> ChangePasswordAsync(ChangePasswordDto dto);

        /* איפוס סיסמה שלב 1: מייצר קוד חד-פעמי ושולח למייל. תמיד מצליח (לא חושף אם המייל קיים). */
        Task RequestPasswordResetAsync(ForgotPasswordDto dto);

        /* איפוס סיסמה שלב 2: מאמת קוד+תוקף ומחליף סיסמה. מחזיר הודעת שגיאה או null בהצלחה. */
        Task<string?> ResetPasswordAsync(ResetPasswordDto dto);

        /* חידוש מנוי בחודש (נקרא אחרי תשלום מאומת בסליקה). מאריך את התוקף ומחזיר טוקן חדש. */
        Task<AuthResult> RenewSubscriptionAsync(int userId);

        /*
          משלים כניסה אחרי שהקוד החד-פעמי אומת. מופרד מ-LoginAsync כי בשלב הזה
          כבר אין סיסמה — האימות נעשה מול האתגר, ומה שנותר הוא בדיקות המנוי
          והנפקת הטוקן. מוודא שוב את תוקף המנוי: ייתכן שפג בין שני השלבים.
        */
        AuthResult CompleteTwoFactorLogin(Models.User user);
    }
}
