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
    }
}
