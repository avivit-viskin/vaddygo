using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      PollsController — סקרי הוועד. קונטרולר דק: מעביר ל-IPollService ומחזיר.
      דורש משתמש מזוהה (FallbackPolicy), וכל פעולה מוגבלת לגן של המשתמש.
      ההצבעה של ההורים נמצאת ב-PublicPollsController (טוקן, בלי חשבון).
    */
    [ApiController]
    [Route("api/polls")]
    public class PollsController : ControllerBase
    {
        private readonly IPollService _polls;

        public PollsController(IPollService polls)
        {
            _polls = polls;
        }

        // GET: api/polls
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PollResponseDto>>> GetPolls(
            [FromHeader(Name = "X-Institution")] int? institution = null)
        {
            return Ok(await _polls.GetAllAsync(institution));
        }

        // POST: api/polls
        [HttpPost]
        public async Task<ActionResult<PollResponseDto>> CreatePoll(
            [FromBody] PollCreateDto dto,
            [FromHeader(Name = "X-Institution")] int? institution = null)
        {
            var created = await _polls.CreateAsync(dto, institution);
            if (created == null)
            {
                return BadRequest(new { message = "צריך שאלה ולפחות שתי אפשרויות" });
            }
            return CreatedAtAction(nameof(GetPolls), new { id = created.Id }, created);
        }

        // PUT: api/polls/1/closed — סגירה/פתיחה מחדש לתשובות
        [HttpPut("{id}/closed")]
        public async Task<ActionResult<PollResponseDto>> SetClosed(
            int id, [FromBody] PollCloseDto dto)
        {
            var updated = await _polls.SetClosedAsync(id, dto.IsClosed);
            return updated == null ? NotFound() : Ok(updated);
        }

        // DELETE: api/polls/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePoll(int id)
        {
            return await _polls.DeleteAsync(id) ? NoContent() : NotFound();
        }
    }
}
