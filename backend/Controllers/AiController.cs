using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      AiController — קונטרולר דק לעוזרת ה-AI (שלב 9).
      אם מפתח ה-API עוד לא הוגדר במשתני הסביבה — מחזיר 503 עם הודעה ידידותית
      במקום שגיאה טכנית, כדי שהלקוח יוכל להנחות את המשתמשת.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;
        private readonly IAccessScope _access;

        public AiController(IAiService aiService, IAccessScope access)
        {
            _aiService = aiService;
            _access = access;
        }

        // POST: api/ai/ask
        [HttpPost("ask")]
        public async Task<ActionResult<AiResponseDto>> Ask(
            [FromBody] AiAskDto dto,
            [FromHeader(Name = "X-Institution")] int? institution = null)
        {
            // אכיפת פרו בשרת: העוזרת היא פיצ'ר פרו, וכל קריאה עולה כסף אמיתי
            // לספק ה-AI — ולכן דווקא כאן חשוב שהחסימה לא תהיה רק בממשק.
            var scoped = await _access.ScopeGroupIdAsync(institution);
            if (!await _access.IsGroupProAsync(scoped))
            {
                throw new ProRequiredException("עוזרת ה-AI היא פיצ'ר של מסלול פרו.");
            }

            if (!_aiService.IsConfigured)
            {
                return StatusCode(503, new
                {
                    message = "עוזרת ה-AI עדיין לא הופעלה. יש להגדיר מפתח Google Gemini במשתני הסביבה."
                });
            }

            var answer = await _aiService.AskAsync(dto.Question, dto.Context);
            return Ok(new AiResponseDto { Answer = answer });
        }
    }
}
