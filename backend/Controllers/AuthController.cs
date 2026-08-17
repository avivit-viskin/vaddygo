using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      AuthController — הרשמה וכניסה פתוחות לכולם (AllowAnonymous על כל פעולה) כי
      כאן מקבלים את ה-token; שינוי סיסמה דורש token (Authorize).
    */
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly ITwoFactorService _twoFactor;

        public AuthController(IAuthService authService, ITwoFactorService twoFactor)
        {
            _authService = authService;
            _twoFactor = twoFactor;
        }

        /*
          כניסה שנעצרה לשלב הקוד מוחזרת כ-**202 Accepted**: הבקשה התקבלה
          והזיהוי הצליח, אבל הפעולה טרם הושלמה. במכוון לא 401 (שהלקוח מפרש
          כ"סיסמה שגויה") ולא 200 (שמשמעו "הנה הטוקן").
        */
        private const int TwoFactorPending = StatusCodes.Status202Accepted;

        // POST: api/auth/register
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);
            if (result.Error != null)
                return Conflict(new { message = result.Error });
            return Ok(result.Response);
        }

        // POST: api/auth/login
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);
            if (result.Error != null)
                return Unauthorized(new { message = result.Error });
            if (result.TwoFactor != null)
                return StatusCode(TwoFactorPending, result.TwoFactor);
            return Ok(result.Response);
        }

        // POST: api/auth/google — כניסה/הרשמה עם Google (מאמת את ה-credential מול גוגל)
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("google")]
        public async Task<ActionResult<AuthResponseDto>> Google([FromBody] GoogleLoginDto dto)
        {
            var result = await _authService.LoginWithGoogleAsync(dto);
            if (result.Error != null)
                return Unauthorized(new { message = result.Error });
            if (result.TwoFactor != null)
                return StatusCode(TwoFactorPending, result.TwoFactor);
            return Ok(result.Response);
        }

        /*
          POST: api/auth/2fa/verify — שלב שני בכניסה. פתוח לאנונימיים בהכרח:
          בנקודה הזאת עדיין אין טוקן, וההרשאה נובעת מהאתגר עצמו + הקוד.
          מוגבל בקצב כמו כל נקודת כניסה אחרת, כדי שלא ינחשו קוד בן 6 ספרות.
        */
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("2fa/verify")]
        public async Task<ActionResult<AuthResponseDto>> VerifyTwoFactor(
            [FromBody] TwoFactorVerifyDto dto)
        {
            var verified = await _twoFactor.VerifyAsync(dto);
            if (verified.User == null)
                return Unauthorized(new { message = verified.Error });

            var result = _authService.CompleteTwoFactorLogin(verified.User);
            if (result.Error != null)
                return Unauthorized(new { message = result.Error });

            // אסימון המכשיר מוחזר רק אם ביקשו "זכור אותי"; הלקוח שומר אותו.
            return Ok(new
            {
                result.Response!.Token,
                result.Response.Username,
                result.Response.Email,
                result.Response.Role,
                result.Response.SubscriptionValidUntil,
                deviceToken = verified.DeviceToken,
            });
        }

        /*
          POST: api/auth/2fa/resend — שליחת הקוד שוב, אפשר בערוץ אחר.
          זו הנקודה שמונעת נעילה: מי שאין לו גישה לתיבת המייל באותו רגע מבקש
          את הקוד ב-SMS בלי להתחיל את ההתחברות מחדש.
        */
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("2fa/resend")]
        public async Task<ActionResult<TwoFactorRequiredDto>> ResendTwoFactor(
            [FromBody] TwoFactorResendDto dto)
        {
            var challenge = await _twoFactor.ResendAsync(dto);
            if (challenge == null)
                return Unauthorized(new { message = "פג תוקף הכניסה. יש להתחבר מחדש." });
            return Ok(challenge);
        }

        // POST: api/auth/change-password — שינוי סיסמה למשתמש מחובר (דורש token)
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var error = await _authService.ChangePasswordAsync(dto);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new { message = "הסיסמה שונתה בהצלחה" });
        }

        // POST: api/auth/forgot-password — איפוס שלב 1: שליחת קוד למייל.
        // תמיד מחזיר הצלחה כללית (לא חושף אם המייל רשום).
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            await _authService.RequestPasswordResetAsync(dto);
            return Ok(new { message = "אם המייל רשום אצלנו, ישלח אליו קוד לאיפוס" });
        }

        // POST: api/auth/reset-password — איפוס שלב 2: קוד + סיסמה חדשה.
        [AllowAnonymous]
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            var error = await _authService.ResetPasswordAsync(dto);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new { message = "הסיסמה אופסה בהצלחה" });
        }
    }
}
