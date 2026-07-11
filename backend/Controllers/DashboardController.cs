using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      DashboardController — קונטרולר דק למסך הבית: כל החישובים ב-IDashboardService.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /* המוסד הפעיל שהלקוח שולח בכותרת X-Institution (מזהה ה-Group). null = בלי סינון. */
        private int? ActiveGroupId =>
            int.TryParse(Request.Headers["X-Institution"], out var id) ? id : null;

        // GET: api/dashboard
        [HttpGet]
        public async Task<ActionResult<DashboardResponseDto>> GetSummary()
        {
            var summary = await _dashboardService.GetSummaryAsync(ActiveGroupId);
            if (summary == null)
                return NotFound(new { message = "עדיין לא הוגדר גן — יש להשלים את אשף ההרשמה" });
            return Ok(summary);
        }
    }
}
