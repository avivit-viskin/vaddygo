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
