using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      AdminController — נתונים שמיועדים למנהלת VaddyGo בלבד (SuperAdmin).
      קונטרולר דק: מעביר ל-Service ומחזיר. כרגע: נתוני שימוש (משפך ההרשמה).
    */
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = "SuperAdmin")]
    public class AdminController : ControllerBase
    {
        private readonly IUsageStatsService _usageStats;

        public AdminController(IUsageStatsService usageStats)
        {
            _usageStats = usageStats;
        }

        // GET: api/admin/usage
        [HttpGet("usage")]
        public async Task<ActionResult<UsageStatsDto>> GetUsage()
        {
            return Ok(await _usageStats.GetUsageAsync());
        }
    }
}
