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
        private readonly IAiService _aiService;

        public PublicVendorsController(IVendorService vendorService, IAiService aiService)
        {
            _vendorService = vendorService;
            _aiService = aiService;
        }

        // POST: api/public/vendors/extract-products — חילוץ מוצרים מטקסט קטלוג (PDF)
        // בעזרת ה-AI. הספק מעלה PDF, הפרונט מחלץ טקסט ושולח לכאן; מקבל רשימת מוצרים.
        [HttpPost("extract-products")]
        public async Task<ActionResult<AiExtractResponseDto>> ExtractProducts(
            [FromBody] AiExtractRequestDto dto)
        {
            if (!_aiService.IsConfigured)
            {
                return StatusCode(503, new
                {
                    message = "חילוץ אוטומטי מ-PDF אינו זמין כרגע."
                });
            }

            // חילוץ מתמונה (צילום קטלוג) — קודם, אם נשלחה תמונה
            var image = dto?.ImageBase64 ?? string.Empty;
            if (image.Length > 0)
            {
                // תקרת גודל לתמונה (base64) — כ-10MB, הגנה מפני קבצים ענקיים
                if (image.Length > 14_000_000)
                {
                    return StatusCode(413, new
                    {
                        message = "התמונה גדולה מדי. נסו צילום קטן יותר."
                    });
                }
                var imgProducts = await _aiService.ExtractProductsFromImageAsync(
                    image, dto?.ImageMimeType ?? "image/jpeg");
                return Ok(new AiExtractResponseDto { Products = imgProducts });
            }

            var text = (dto?.Text ?? string.Empty).Trim();
            if (text.Length == 0)
            {
                return Ok(new AiExtractResponseDto());
            }
            // תקרה על אורך הטקסט — הגנה מפני קבצים ענקיים/עלות מיותרת
            if (text.Length > 20000)
            {
                text = text.Substring(0, 20000);
            }

            var products = await _aiService.ExtractProductsAsync(text);
            return Ok(new AiExtractResponseDto { Products = products });
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

        // POST: api/public/vendors/google-login — כניסת ספק עם Google. מאמת את ה-
        // credential מול גוגל, מוצא ספק לפי מייל ההתחברות, ומחזיר את טוקן העריכה.
        [HttpPost("google-login")]
        public async Task<ActionResult> GoogleLogin([FromBody] GoogleLoginDto dto)
        {
            var token = await _vendorService.LoginWithGoogleAsync(dto.Credential);
            if (token == null)
                return Unauthorized(new
                {
                    message = "לא נמצא ספק עם המייל של חשבון הגוגל. אפשר להתחבר עם מייל וסיסמה, או להירשם."
                });
            return Ok(new { editToken = token });
        }

        // POST: api/public/vendors/register — הרשמת ספק חדש בעצמו (שם+מייל+סיסמה).
        // נוצר ספק חדש עם טוקן עריכה, והלקוח ממשיך איתו לעמוד מילוי הכרטיס.
        [HttpPost("register")]
        public async Task<ActionResult> Register([FromBody] VendorRegisterDto dto)
        {
            var (token, error) = await _vendorService.RegisterAsync(
                dto.Name, dto.LoginEmail, dto.Password);
            if (token == null)
                return BadRequest(new { message = error });
            return Ok(new { editToken = token });
        }

        // POST: api/public/vendors/forgot-password — שולח קוד איפוס למייל שהספק הגדיר.
        // תמיד מחזיר הצלחה כללית (לא חושף אם המייל רשום) — מונע enumeration.
        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword([FromBody] VendorForgotPasswordDto dto)
        {
            await _vendorService.RequestPasswordResetAsync(dto.Email);
            return Ok(new { message = "אם המייל רשום אצלנו, שלחנו אליו קוד לאיפוס" });
        }

        // POST: api/public/vendors/reset-password — איפוס הסיסמה עם הקוד שהתקבל במייל.
        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword([FromBody] VendorResetPasswordDto dto)
        {
            var error = await _vendorService.ResetPasswordAsync(
                dto.LoginEmail, dto.Code, dto.NewPassword);
            if (error != null)
                return BadRequest(new { message = error });
            return Ok(new { message = "הסיסמה אופסה בהצלחה" });
        }

        // PUT: api/public/vendors/{token}/password — שינוי סיסמה של ספק מחובר
        // (הטוקן הוא ההרשאה, בלי צורך בקוד מייל).
        [HttpPut("{token}/password")]
        public async Task<ActionResult> ChangePassword(
            string token, [FromBody] VendorChangePasswordDto dto)
        {
            var ok = await _vendorService.ChangePasswordAsync(token, dto.NewPassword);
            if (!ok)
                return NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" });
            return Ok(new { message = "הסיסמה עודכנה" });
        }

        // POST: api/public/vendors/{token}/request-deletion — הספק מבקש למחוק את
        // חשבונו. נרשם וממתין לאישור VaddyGo; המחיקה בפועל נעשית ע"י המנהלת.
        [HttpPost("{token}/request-deletion")]
        public async Task<ActionResult> RequestDeletion(string token)
        {
            var ok = await _vendorService.RequestDeletionAsync(token);
            if (!ok)
                return NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" });
            return Ok(new { message = "בקשת המחיקה נשלחה לאישור VaddyGo" });
        }

        // GET: api/public/vendors/directory — מדריך ספקים ציבורי (מרקטפלייס).
        // literal "directory" גובר בניתוב על "{token}".
        [HttpGet("directory")]
        public async Task<ActionResult<IEnumerable<VendorDirectoryDto>>> Directory()
        {
            return Ok(await _vendorService.GetDirectoryAsync());
        }

        // GET: api/public/vendors/catalog/{id} — קטלוג ציבורי של ספק, לשיתוף (בלי תשלום).
        [HttpGet("catalog/{id:int}")]
        public async Task<ActionResult<VendorResponseDto>> Catalog(int id)
        {
            var vendor = await _vendorService.GetPublicCatalogAsync(id);
            if (vendor == null)
                return NotFound(new { message = "הקטלוג לא נמצא" });
            return Ok(vendor);
        }
    }
}
