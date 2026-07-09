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

        public AiController(IAiService aiService)
        {
            _aiService = aiService;
        }

        // POST: api/ai/ask
        [HttpPost("ask")]
        public async Task<ActionResult<AiResponseDto>> Ask([FromBody] AiAskDto dto)
        {
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
