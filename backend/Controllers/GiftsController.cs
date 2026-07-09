using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      GiftsController — קונטרולר דק למתנות (UI_SPEC ס' 12). כל הלוגיקה ב-IGiftService;
      הוולידציה מה-DTOs רצה אוטומטית ([ApiController]) ומחזירה 400 בעברית.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class GiftsController : ControllerBase
    {
        private readonly IGiftService _giftService;

        public GiftsController(IGiftService giftService)
        {
            _giftService = giftService;
        }

        // GET: api/gifts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GiftResponseDto>>> GetAllGifts()
        {
            return Ok(await _giftService.GetAllAsync());
        }

        // GET: api/gifts/1
        [HttpGet("{id}")]
        public async Task<ActionResult<GiftResponseDto>> GetGift(int id)
        {
            var gift = await _giftService.GetByIdAsync(id);
            if (gift == null)
                return NotFound(new { message = "מתנה לא נמצאה" });
            return Ok(gift);
        }

        // POST: api/gifts
        [HttpPost]
        public async Task<ActionResult<GiftResponseDto>> CreateGift([FromBody] GiftCreateDto dto)
        {
            var created = await _giftService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetGift), new { id = created.Id }, created);
        }

        // PUT: api/gifts/1
        [HttpPut("{id}")]
        public async Task<ActionResult<GiftResponseDto>> UpdateGift(int id, [FromBody] GiftUpdateDto dto)
        {
            var updated = await _giftService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "מתנה לא נמצאה" });
            return Ok(updated);
        }

        // DELETE: api/gifts/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGift(int id)
        {
            var deleted = await _giftService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "מתנה לא נמצאה" });
            return NoContent();
        }
    }
}
