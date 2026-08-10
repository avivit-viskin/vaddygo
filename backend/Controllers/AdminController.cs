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
        private readonly ISubscriptionsService _subscriptions;

        public AdminController(
            IUsageStatsService usageStats,
            ISubscriptionsService subscriptions)
        {
            _usageStats = usageStats;
            _subscriptions = subscriptions;
        }

        // GET: api/admin/usage
        [HttpGet("usage")]
        public async Task<ActionResult<UsageStatsDto>> GetUsage()
        {
            return Ok(await _usageStats.GetUsageAsync());
        }

        // GET: api/admin/subscriptions — מי במסלול פרו ועד מתי (ועדים וספקים)
        [HttpGet("subscriptions")]
        public async Task<ActionResult<SubscriptionsDto>> GetSubscriptions()
        {
            return Ok(await _subscriptions.GetAsync());
        }
    }
}
