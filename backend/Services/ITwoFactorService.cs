using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Services
{
    /*
      תוצאת אימות קוד: או שהצליח (ואז יש משתמש ואולי אסימון מכשיר לזכור),
      או שנכשל (ואז יש הודעה). אף פעם לא שניהם.
    */
    public record TwoFactorVerifyResult(User? User, string? DeviceToken, string? Error);

    /*
      ITwoFactorService — כל הלוגיקה של השלב השני בהתחברות.

      מופרד מ-AuthService במכוון: AuthService עונה על "מי אתה", וזה עונה על
      "הוכח שזה באמת אתה". הפרדה זו גם מאפשרת לזרימת ההתחברות להישאר קריאה —
      היא רק שואלת "צריך אתגר?" ומוסרת את השאר.
    */
    public interface ITwoFactorService
    {
        /*
          האם יש להעמיד אתגר בפני המשתמש הזה. false אם האימות כבוי, או אם
          הבקשה הגיעה ממכשיר שנזכר בעבר ועדיין בתוקף.
        */
        Task<bool> IsRequiredAsync(User user, string? deviceToken);

        /* יוצר אתגר, שולח קוד, ומחזיר את מה שהלקוח צריך כדי להציג מסך קוד. */
        Task<TwoFactorRequiredDto> StartChallengeAsync(User user, string? channelKey = null);

        Task<TwoFactorVerifyResult> VerifyAsync(TwoFactorVerifyDto dto);

        /* שליחה חוזרת — אפשר בערוץ אחר. מחזיר null אם האתגר כבר לא קיים. */
        Task<TwoFactorRequiredDto?> ResendAsync(TwoFactorResendDto dto);

        Task<TwoFactorStatusDto> GetStatusAsync(int userId);

        /* שלב 1 בהפעלה — שולח קוד לערוץ הנבחר כדי לוודא שהוא באמת מגיע. */
        Task<(TwoFactorRequiredDto? Challenge, string? Error)> StartSetupAsync(
            int userId, TwoFactorSetupDto dto);

        /* שלב 2 — מפעיל ומחזיר את קודי הגיבוי (הפעם היחידה שהם נראים). */
        Task<(List<string>? Codes, string? Error)> EnableAsync(int userId, TwoFactorEnableDto dto);

        Task<string?> DisableAsync(int userId, string password);

        Task<(List<string>? Codes, string? Error)> RegenerateBackupCodesAsync(
            int userId, string password);

        /* מבטל את כל המכשירים הזכורים — "התנתקי מכל המכשירים". */
        Task<string?> ForgetDevicesAsync(int userId, string password);
    }
}
