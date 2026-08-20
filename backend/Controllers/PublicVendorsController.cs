using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
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
    [EnableRateLimiting(RateLimitPolicies.Public)]
    public class PublicVendorsController : ControllerBase
    {
        private readonly IVendorService _vendorService;
        private readonly IVendorProPaymentService _vendorProPayments;
        private readonly IAiService _aiService;
        private readonly ISupplierReportService _reports;

        public PublicVendorsController(
            IVendorService vendorService,
            IAiService aiService,
            IVendorProPaymentService vendorProPayments,
            ISupplierReportService reports)
        {
            _vendorProPayments = vendorProPayments;
            _vendorService = vendorService;
            _aiService = aiService;
            _reports = reports;
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
                    BadRequest(new { message = "צריך מייל וסיסמה באורך 8 תווים לפחות" }),
                _ => NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" }),
            };
        }

        // POST: api/public/vendors/login — התחברות ספק; מאמת מייל+סיסמה ומחזיר
        // את טוקן העריכה (הלקוח ממשיך איתו לעמוד העריכה).
        [EnableRateLimiting(RateLimitPolicies.Auth)]
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
        [EnableRateLimiting(RateLimitPolicies.Auth)]
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
        [EnableRateLimiting(RateLimitPolicies.Auth)]
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
        [EnableRateLimiting(RateLimitPolicies.Auth)]
        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword([FromBody] VendorForgotPasswordDto dto)
        {
            await _vendorService.RequestPasswordResetAsync(dto.Email);
            return Ok(new { message = "אם המייל רשום אצלנו, שלחנו אליו קוד לאיפוס" });
        }

        // POST: api/public/vendors/reset-password — איפוס הסיסמה עם הקוד שהתקבל במייל.
        [EnableRateLimiting(RateLimitPolicies.Auth)]
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

        // POST: api/public/vendors/{id}/lead — ועד שולח "בקשת הצעת מחיר" (RFQ).
        // עם גוף (פרטי הבקשה) → נשמרת פנייה מלאה בתיבת הספק; בלי גוף → רק מונה הפניות.
        [HttpPost("{id:int}/lead")]
        public async Task<IActionResult> Lead(
            int id,
            [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] LeadCreateDto? dto = null)
        {
            var hasDetails = dto != null && !string.IsNullOrWhiteSpace(
                $"{dto.Subject}{dto.Message}{dto.ContactPhone}{dto.ContactName}");
            if (hasDetails)
            {
                var groupId = int.TryParse(Request.Headers["X-Institution"], out var g)
                    ? g
                    : (int?)null;
                var created = await _vendorService.CreateLeadAsync(id, groupId, dto!);
                if (!created)
                    return NotFound(new { message = "הספק לא נמצא" });
                return NoContent();
            }
            await _vendorService.RecordLeadAsync(id);
            return NoContent();
        }

        // GET: api/public/vendors/{token}/leads — תיבת הפניות (RFQ) של הספק, לפי הטוקן.
        [HttpGet("{token}/leads")]
        public async Task<ActionResult<IEnumerable<LeadResponseDto>>> Leads(string token)
        {
            var leads = await _vendorService.GetLeadsByEditTokenAsync(token);
            if (leads == null)
                return NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" });
            return Ok(leads);
        }

        /*
          GET: api/public/vendors/{token}/report?from=&to= — הדוח המפורט של הספק.

          הטווח אופציונלי; בלעדיו מוחזרת השנה האחרונה. ההרשאה היא הטוקן בלבד,
          כמו בשאר מסכי הספק — ולכן השירות מחזיר null לטוקן שפג, והתשובה היא
          404 אחיד שאינו מרמז אם הספק קיים.
        */
        [HttpGet("{token}/report")]
        public async Task<ActionResult<SupplierReportDto>> Report(
            string token, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            var report = await _reports.GetByTokenAsync(token, from, to);
            if (report == null)
                return NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" });
            return Ok(report);
        }

        // PUT: api/public/vendors/{token}/leads/{leadId}/status — הספק מעדכן סטטוס פנייה.
        [HttpPut("{token}/leads/{leadId:int}/status")]
        public async Task<IActionResult> UpdateLeadStatus(
            string token, int leadId, [FromBody] LeadStatusDto dto)
        {
            var ok = await _vendorService.UpdateLeadStatusAsync(token, leadId, dto.Status);
            if (!ok)
                return BadRequest(new { message = "לא ניתן לעדכן את הסטטוס" });
            return NoContent();
        }

        /*
          POST: api/public/vendors/{token}/pro-checkout — הספק רוכש מסלול פרו.
          פותח עמוד תשלום מאובטח אצל ספק הסליקה ומחזיר את כתובתו; המסלול נפתח
          בפועל רק כשמגיע אישור משרת-לשרת (webhook) — לעולם לא לפי חזרת הדפדפן,
          שאותה אפשר לזייף.
        */
        [HttpPost("{token}/pro-checkout")]
        public async Task<IActionResult> ProCheckout(
            string token, [FromBody] ProCheckoutDto? dto)
        {
            // בלי סליקה אמיתית לא פותחים תשלום כלל — עדיף להפנות לוואטסאפ
            // מאשר לשלוח ספק לעמוד תשלום מדומה שלא באמת גובה.
            if (!_vendorProPayments.IsAvailable)
            {
                return StatusCode(503, new
                {
                    message = "התשלום המקוון עדיין אינו פעיל. אפשר לפנות אלינו בוואטסאפ ונפתח את המסלול."
                });
            }
            var returnUrl = (dto?.ReturnUrl ?? string.Empty).Trim();
            if (returnUrl.Length == 0)
            {
                return BadRequest(new { message = "חסרה כתובת חזרה" });
            }
            var paymentUrl = await _vendorProPayments.StartCheckoutAsync(token, returnUrl);
            if (paymentUrl == null)
                return NotFound(new { message = "הקישור אינו תקין או שכבר אינו בתוקף" });
            return Ok(new { paymentUrl });
        }
    }
}
