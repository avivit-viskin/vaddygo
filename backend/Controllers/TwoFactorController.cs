using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      TwoFactorController — ניהול האימות הדו-שלבי של **החשבון שלי בלבד**.

      אין כאן פרמטר userId ואי אפשר לגעת בחשבון של מישהו אחר: המשתמש נלקח
      מה-JWT דרך IAccessScope. זה מכוון — הפעלה או כיבוי של אימות בחשבון זר
      היא בדיוק הפעולה שהתכונה הזאת אמורה למנוע.

      נקודות הכניסה עצמן (verify/resend) יושבות ב-AuthController, כי הן חייבות
      להיות פתוחות לאנונימיים — בשלב ההוא עדיין אין טוקן.
    */
    [ApiController]
    [Authorize]
    [Route("api/auth/2fa")]
    public class TwoFactorController : ControllerBase
    {
        private readonly ITwoFactorService _twoFactor;
        private readonly IAccessScope _access;

        public TwoFactorController(ITwoFactorService twoFactor, IAccessScope access)
        {
            _twoFactor = twoFactor;
            _access = access;
        }

        // GET: api/auth/2fa — מצב האימות שלי (למסך ההגדרות)
        [HttpGet]
        public async Task<ActionResult<TwoFactorStatusDto>> Status()
        {
            var userId = _access.UserId;
            if (userId == null)
                return Unauthorized();
            return Ok(await _twoFactor.GetStatusAsync(userId.Value));
        }

        // POST: api/auth/2fa/setup — שלב 1: בחירת ערוץ ושליחת קוד אליו
        [HttpPost("setup")]
        public async Task<ActionResult<TwoFactorRequiredDto>> Setup([FromBody] TwoFactorSetupDto dto)
        {
            var userId = _access.UserId;
            if (userId == null)
                return Unauthorized();

            var (challenge, error) = await _twoFactor.StartSetupAsync(userId.Value, dto);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(challenge);
        }

        /*
          POST: api/auth/2fa/enable — שלב 2: הקוד שהתקבל.
          מחזיר את קודי הגיבוי — **הפעם היחידה שהם נשלחים**. אינם ניתנים
          לשחזור מאוחר יותר, רק להחלפה בסט חדש.
        */
        [HttpPost("enable")]
        public async Task<ActionResult<TwoFactorBackupCodesDto>> Enable(
            [FromBody] TwoFactorEnableDto dto)
        {
            var userId = _access.UserId;
            if (userId == null)
                return Unauthorized();

            var (codes, error) = await _twoFactor.EnableAsync(userId.Value, dto);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new TwoFactorBackupCodesDto { Codes = codes! });
        }

        // POST: api/auth/2fa/disable — כיבוי. דורש סיסמה גם למשתמש מחובר.
        [HttpPost("disable")]
        public async Task<IActionResult> Disable([FromBody] TwoFactorPasswordDto dto)
        {
            var userId = _access.UserId;
            if (userId == null)
                return Unauthorized();

            var error = await _twoFactor.DisableAsync(userId.Value, dto.Password);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new { message = "האימות הדו-שלבי כובה" });
        }

        // POST: api/auth/2fa/backup-codes — הנפקת סט חדש (הישן מתבטל)
        [HttpPost("backup-codes")]
        public async Task<ActionResult<TwoFactorBackupCodesDto>> RegenerateBackupCodes(
            [FromBody] TwoFactorPasswordDto dto)
        {
            var userId = _access.UserId;
            if (userId == null)
                return Unauthorized();

            var (codes, error) = await _twoFactor.RegenerateBackupCodesAsync(
                userId.Value, dto.Password);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new TwoFactorBackupCodesDto { Codes = codes! });
        }

        // POST: api/auth/2fa/forget-devices — לדרוש קוד מכל המכשירים מחדש
        [HttpPost("forget-devices")]
        public async Task<IActionResult> ForgetDevices([FromBody] TwoFactorPasswordDto dto)
        {
            var userId = _access.UserId;
            if (userId == null)
                return Unauthorized();

            var error = await _twoFactor.ForgetDevicesAsync(userId.Value, dto.Password);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new { message = "כל המכשירים הזכורים נותקו" });
        }
    }
}
