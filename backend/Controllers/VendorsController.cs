using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      VendorsController — קונטרולר דק לספקים (UI_SPEC ס' 12). כל הלוגיקה ב-IVendorService.
    */
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
        [HttpPost]
        public async Task<ActionResult<VendorResponseDto>> CreateVendor([FromBody] VendorCreateDto dto)
        {
            var created = await _vendorService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetVendor), new { id = created.Id }, created);
        }

        // PUT: api/vendors/1
        [HttpPut("{id}")]
        public async Task<ActionResult<VendorResponseDto>> UpdateVendor(int id, [FromBody] VendorUpdateDto dto)
        {
            var updated = await _vendorService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "ספק לא נמצא" });
            return Ok(updated);
        }

        // DELETE: api/vendors/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVendor(int id)
        {
            var deleted = await _vendorService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "ספק לא נמצא" });
            return NoContent();
        }
    }
}
