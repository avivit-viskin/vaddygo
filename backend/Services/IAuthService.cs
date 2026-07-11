using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    // מוחזר מהשירות עם הודעת שגיאה ידידותית כשההרשמה/כניסה נכשלת
    public record AuthResult(AuthResponseDto? Response, string? Error);

    public interface IAuthService
    {
        Task<AuthResult> RegisterAsync(RegisterDto dto);
        Task<AuthResult> LoginAsync(LoginDto dto);
        Task<AuthResult> LoginWithGoogleAsync(GoogleLoginDto dto);
    }
}
