using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      PublicVendorsController — עריכה עצמית של ספק דרך טוקן, בלי חשבון/התחברות.
      הטוקן (GUID לא-ניתן-לניחוש) הוא אמצעי הזיהוי: מי שמחזיק בקישור יכול לצפות
      ולערוך אך ורק את הכרטיס שלו. חשוף לאנונימיים (חריג ל-FallbackPolicy) —
      אין כאן גישה לרשימת הספקים, רק לספק שהטוקן שלו נשלח.
    */
    [ApiController]
    [Route("api/public/vendors")]
    [AllowAnonymous]
    public class PublicVendorsController : ControllerBase
    {
        private readonly IVendorService _vendorService;

        public PublicVendorsController(IVendorService vendorService)
        {
            _vendorService = vendorService;
        }

        // GET: api/public/vendors/{token} — טעינת הכרטיס של הספק לעריכה
        [HttpGet("{token}")]
        public async Task<ActionResult<VendorResponseDto>> GetByToken(string token)
        {
            var vendor = await _vendorService.GetByEditTokenAsync(token);
            if (vendor == null)
                return NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" });
            return Ok(vendor);
        }

        // PUT: api/public/vendors/{token} — שמירת השינויים שהספק ביצע בכרטיס שלו
        [HttpPut("{token}")]
        public async Task<ActionResult<VendorResponseDto>> UpdateByToken(
            string token, [FromBody] VendorUpdateDto dto)
        {
            var updated = await _vendorService.UpdateByEditTokenAsync(token, dto);
            if (updated == null)
                return NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" });
            return Ok(updated);
        }

        // PUT: api/public/vendors/{token}/credentials — הספק מגדיר מייל+סיסמה
        // כדי שיוכל לחזור בפעם הבאה בלי הקישור.
        [HttpPut("{token}/credentials")]
        public async Task<ActionResult> SetCredentials(
            string token, [FromBody] VendorCredentialsDto dto)
        {
            var result = await _vendorService.SetCredentialsAsync(
                token, dto.LoginEmail, dto.Password);
            return result switch
            {
                CredentialResult.Ok => Ok(new { message = "פרטי ההתחברות נשמרו" }),
                CredentialResult.EmailTaken =>
                    Conflict(new { message = "כתובת המייל כבר בשימוש ספק אחר" }),
                CredentialResult.Invalid =>
                    BadRequest(new { message = "צריך מייל וסיסמה באורך 6 תווים לפחות" }),
                _ => NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" }),
            };
        }

        // POST: api/public/vendors/login — התחברות ספק; מאמת מייל+סיסמה ומחזיר
        // את טוקן העריכה (הלקוח ממשיך איתו לעמוד העריכה).
        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] VendorLoginDto dto)
        {
            var token = await _vendorService.LoginAsync(dto.LoginEmail, dto.Password);
            if (token == null)
                return Unauthorized(new { message = "מייל או סיסמה שגויים" });
            return Ok(new { editToken = token });
        }
    }
}
