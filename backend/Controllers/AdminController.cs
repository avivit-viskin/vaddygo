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
        private readonly ISecurityStatusService _security;

        public AdminController(
            IUsageStatsService usageStats,
            ISubscriptionsService subscriptions,
            ISecurityStatusService security)
        {
            _usageStats = usageStats;
            _subscriptions = subscriptions;
            _security = security;
        }

        // GET: api/admin/usage
        [HttpGet("usage")]
        public async Task<ActionResult<UsageStatsDto>> GetUsage()
        {
            return Ok(await _usageStats.GetUsageAsync());
        }

        // GET: api/admin/security — אילו הגנות פעילות בפועל (דגלים בלבד)
        [HttpGet("security")]
        public ActionResult<SecurityStatusDto> GetSecurity()
        {
            return Ok(_security.Get());
        }

        // GET: api/admin/subscriptions — מי במסלול פרו ועד מתי (ועדים וספקים)
        [HttpGet("subscriptions")]
        public async Task<ActionResult<SubscriptionsDto>> GetSubscriptions()
        {
            return Ok(await _subscriptions.GetAsync());
        }
    }
}
