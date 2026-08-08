using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      PublicPollsController — כאן ההורים עונים על הסקר, דרך הקישור שהוועד שלח
      בוואטסאפ. חשוף לאנונימיים (חריג ל-FallbackPolicy) בכוונה: אין להורים
      חשבון במערכת, ואיננו רוצים לאסוף מהם פרטים מזהים.

      גבולות הגישה: הטוקן פותח סקר *אחד* בלבד, ומאפשר רק לקרוא אותו ולהצביע —
      לא לערוך, לא למחוק, ולא להגיע לרשימת הסקרים או לנתוני הגן.
    */
    [ApiController]
    [Route("api/public/polls")]
    [AllowAnonymous]
    public class PublicPollsController : ControllerBase
    {
        private readonly IPollService _polls;

        public PublicPollsController(IPollService polls)
        {
            _polls = polls;
        }

        // GET: api/public/polls/{token} — השאלה, האפשרויות והתוצאות עד כה
        [HttpGet("{token}")]
        public async Task<ActionResult<PublicPollDto>> GetPoll(string token)
        {
            var poll = await _polls.GetPublicAsync(token);
            return poll == null
                ? NotFound(new { message = "הסקר לא נמצא. אפשר לבקש מהוועד קישור מעודכן." })
                : Ok(poll);
        }

        // POST: api/public/polls/{token}/vote — הצבעת הורה
        [HttpPost("{token}/vote")]
        public async Task<ActionResult<PublicPollDto>> Vote(
            string token, [FromBody] PollVoteDto dto)
        {
            var (poll, error) = await _polls.VoteAsync(token, dto);
            if (poll == null)
            {
                return NotFound(new { message = error });
            }
            if (error != null)
            {
                // הסקר קיים אבל ההצבעה לא נקלטה (סגור / כבר הצביעו) — מחזירים
                // גם את התוצאות, כדי שההורה יראה את המצב ולא רק הודעת שגיאה.
                return BadRequest(new { message = error, poll });
            }
            return Ok(poll);
        }
    }
}
