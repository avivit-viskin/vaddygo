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

        // GET: api/dashboard
        [HttpGet]
        public async Task<ActionResult<DashboardResponseDto>> GetSummary()
        {
            var summary = await _dashboardService.GetSummaryAsync();
            if (summary == null)
                return NotFound(new { message = "עדיין לא הוגדר גן — יש להשלים את אשף ההרשמה" });
            return Ok(summary);
        }
    }
}
