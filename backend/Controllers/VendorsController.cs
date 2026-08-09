using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      VendorsController — קונטרולר דק לספקים (UI_SPEC ס' 12). כל הלוגיקה ב-IVendorService.
    */
    // ניהול ספקים (הוספה/עריכה/מחיקה/הפקת קישור) שמור למנהלת VaddyGo בלבד —
    // נאכף בשרת ב-[Authorize(Roles = "SuperAdmin")] על פעולות הכתיבה. הצפייה
    // (GET) פתוחה לכל משתמש מזוהה, כדי שכל וועד יוכל לראות ספקים ולשלם.
    // עריכה עצמית של הספק מתבצעת ב-PublicVendorsController (טוקן, AllowAnonymous).
    [ApiController]
    [Route("api/[controller]")]
    public class VendorsController : ControllerBase
    {
        private readonly IVendorService _vendorService;

        public VendorsController(IVendorService vendorService)
        {
            _vendorService = vendorService;
        }

        // GET: api/vendors
        [HttpGet]
        public async Task<ActionResult<IEnumerable<VendorResponseDto>>> GetAllVendors()
        {
            return Ok(await _vendorService.GetAllAsync());
        }

        // GET: api/vendors/1
        [HttpGet("{id}")]
        public async Task<ActionResult<VendorResponseDto>> GetVendor(int id)
        {
            var vendor = await _vendorService.GetByIdAsync(id);
            if (vendor == null)
                return NotFound(new { message = "ספק לא נמצא" });
            return Ok(vendor);
        }

        // POST: api/vendors
        [Authorize(Roles = "SuperAdmin")]
        [HttpPost]
        public async Task<ActionResult<VendorResponseDto>> CreateVendor([FromBody] VendorCreateDto dto)
        {
            var created = await _vendorService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetVendor), new { id = created.Id }, created);
        }

        // PUT: api/vendors/1
        [Authorize(Roles = "SuperAdmin")]
        [HttpPut("{id}")]
        public async Task<ActionResult<VendorResponseDto>> UpdateVendor(int id, [FromBody] VendorUpdateDto dto)
        {
            var updated = await _vendorService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "ספק לא נמצא" });
            return Ok(updated);
        }

        // POST: api/vendors/1/edit-link — מייצר (או מחזיר) קישור עריכה אישי לספק
        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("{id}/edit-link")]
        public async Task<ActionResult> CreateEditLink(int id)
        {
            var token = await _vendorService.GenerateEditTokenAsync(id);
            if (token == null)
                return NotFound(new { message = "ספק לא נמצא" });
            return Ok(new { editToken = token });
        }

        // PUT: api/vendors/1/featured — סימון/ביטול "ספק מומלץ" (מנהלת VaddyGo בלבד)
        [Authorize(Roles = "SuperAdmin")]
        [HttpPut("{id}/featured")]
        public async Task<ActionResult<VendorResponseDto>> SetFeatured(int id, [FromBody] SetFeaturedDto dto)
        {
            var updated = await _vendorService.SetFeaturedAsync(id, dto.Featured);
            if (updated == null)
                return NotFound(new { message = "ספק לא נמצא" });
            return Ok(updated);
        }

        // PUT: api/vendors/1/pro — פתיחה/סגירה של מסלול פרו לספק (מנהלת VaddyGo בלבד)
        [Authorize(Roles = "SuperAdmin")]
        [HttpPut("{id}/pro")]
        public async Task<ActionResult<VendorResponseDto>> SetPro(int id, [FromBody] SetProDto dto)
        {
            var updated = await _vendorService.SetProAsync(id, dto.IsPro);
            if (updated == null)
                return NotFound(new { message = "ספק לא נמצא" });
            return Ok(updated);
        }

        // DELETE: api/vendors/1
        [Authorize(Roles = "SuperAdmin")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVendor(int id)
        {
            var deleted = await _vendorService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "ספק לא נמצא" });
            return NoContent();
        }

        // POST: api/vendors/1/dismiss-deletion — דחיית בקשת מחיקה שהגיש הספק
        // (בלי למחוק). שמור למנהלת VaddyGo בלבד.
        [Authorize(Roles = "SuperAdmin")]
        [HttpPost("{id}/dismiss-deletion")]
        public async Task<IActionResult> DismissDeletion(int id)
        {
            var ok = await _vendorService.DismissDeletionAsync(id);
            if (!ok)
                return NotFound(new { message = "ספק לא נמצא" });
            return NoContent();
        }
    }
}
