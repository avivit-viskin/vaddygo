using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IVendorService — חוזה הלוגיקה העסקית של הספקים (BL).
    */
    public interface IVendorService
    {
        Task<List<VendorResponseDto>> GetAllAsync();
        Task<VendorResponseDto?> GetByIdAsync(int id);
        Task<VendorResponseDto> CreateAsync(VendorCreateDto dto);
        Task<VendorResponseDto?> UpdateAsync(int id, VendorUpdateDto dto);
        Task<bool> DeleteAsync(int id);

        /* עריכה עצמית של הספק דרך טוקן (בלי חשבון) */
        Task<string?> GenerateEditTokenAsync(int id);
        Task<VendorResponseDto?> GetByEditTokenAsync(string token);
        Task<VendorResponseDto?> UpdateByEditTokenAsync(string token, VendorUpdateDto dto);

        /* התחברות ספק: הגדרת מייל+סיסמה (דרך הטוקן), והתחברות שמחזירה טוקן */
        Task<CredentialResult> SetCredentialsAsync(string token, string loginEmail, string password);
        Task<string?> LoginAsync(string loginEmail, string password);
        Task<string?> LoginWithGoogleAsync(string credential);

        /* הרשמת ספק חדש בעצמו (שם + מייל + סיסמה). מחזיר את טוקן העריכה בהצלחה,
           או הודעת שגיאה (מייל תפוס/לא תקין). */
        Task<(string? Token, string? Error)> RegisterAsync(
            string name, string loginEmail, string password);

        /* איפוס סיסמה לספק (כמו למנוי): בקשת קוד חד-פעמי למייל, ואיפוס עם הקוד.
           Request תמיד "מצליח" (לא חושפים אם המייל קיים). Reset מחזיר null בהצלחה
           או הודעת שגיאה אחידה כשהקוד שגוי/פג. */
        Task RequestPasswordResetAsync(string email);
        Task<string?> ResetPasswordAsync(string loginEmail, string code, string newPassword);

        /* שינוי סיסמה של ספק מחובר (דרך הטוקן, בלי הקוד). false אם הטוקן לא נמצא. */
        Task<bool> ChangePasswordAsync(string token, string newPassword);

        /* בקשת מחיקת חשבון מצד הספק (דרך הטוקן) — נרשמת וממתינה לאישור VaddyGo. */
        Task<bool> RequestDeletionAsync(string token);
        /* ביטול בקשת מחיקה ע"י המנהלת (SuperAdmin) — מנקה את הדגל. */
        Task<bool> DismissDeletionAsync(int id);

        /* קטלוג ציבורי לקריאה בלבד (לשיתוף) — כרטיס הספק בלי פרטי תשלום/כניסה. */
        Task<VendorResponseDto?> GetPublicCatalogAsync(int id);
        Task<bool> RecordLeadAsync(int id);
        Task<VendorResponseDto?> SetFeaturedAsync(int id, bool featured);
        Task<VendorResponseDto?> SetProAsync(int id, bool isPro);
        /* מדריך הספקים הציבורי — רשימה קלילה לגלישה/סינון. */
        Task<List<VendorDirectoryDto>> GetDirectoryAsync();
    }

    /* תוצאת הגדרת פרטי התחברות לספק */
    public enum CredentialResult
    {
        Ok,
        NotFound,
        Invalid,
        EmailTaken,
    }
}
