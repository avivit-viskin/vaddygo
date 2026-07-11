using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      EventsController — קונטרולר דק לאירועי לוח השנה (שלב 6).
      הוולידציה מה-DTOs רצה אוטומטית ([ApiController]) ומחזירה 400 בעברית.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class EventsController : ControllerBase
    {
        private readonly IEventService _eventService;

        public EventsController(IEventService eventService)
        {
            _eventService = eventService;
        }

        /* המוסד הפעיל שהלקוח שולח בכותרת X-Institution (מזהה ה-Group). null = בלי סינון. */
        private int? ActiveGroupId =>
            int.TryParse(Request.Headers["X-Institution"], out var id) ? id : null;

        // GET: api/events
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EventResponseDto>>> GetAllEvents()
        {
            return Ok(await _eventService.GetAllAsync(ActiveGroupId));
        }

        // GET: api/events/1
        [HttpGet("{id}")]
        public async Task<ActionResult<EventResponseDto>> GetEvent(int id)
        {
            var item = await _eventService.GetByIdAsync(id);
            if (item == null)
                return NotFound(new { message = "האירוע לא נמצא" });
            return Ok(item);
        }

        // POST: api/events
        [HttpPost]
        public async Task<ActionResult<EventResponseDto>> CreateEvent([FromBody] EventCreateDto dto)
        {
            var created = await _eventService.CreateAsync(dto, ActiveGroupId);
            return CreatedAtAction(nameof(GetEvent), new { id = created.Id }, created);
        }

        // PUT: api/events/1
        [HttpPut("{id}")]
        public async Task<ActionResult<EventResponseDto>> UpdateEvent(int id, [FromBody] EventUpdateDto dto)
        {
            var updated = await _eventService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "האירוע לא נמצא" });
            return Ok(updated);
        }

        // DELETE: api/events/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEvent(int id)
        {
            var deleted = await _eventService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "האירוע לא נמצא" });
            return NoContent();
        }
    }
}
