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
        private readonly IEncryptionBackfillService _backfill;

        public AdminController(
            IUsageStatsService usageStats,
            ISubscriptionsService subscriptions,
            ISecurityStatusService security,
            IEncryptionBackfillService backfill)
        {
            _usageStats = usageStats;
            _subscriptions = subscriptions;
            _security = security;
            _backfill = backfill;
        }

        // GET: api/admin/usage
        [HttpGet("usage")]
        public async Task<ActionResult<UsageStatsDto>> GetUsage()
        {
            return Ok(await _usageStats.GetUsageAsync());
        }

        // GET: api/admin/security — אילו הגנות פעילות בפועל (דגלים בלבד)
        [HttpGet("security")]
        public async Task<ActionResult<SecurityStatusDto>> GetSecurity()
        {
            return Ok(await _security.GetAsync());
        }

        /*
          POST: api/admin/encrypt-existing — מצפין רשומות שנשמרו לפני הפעלת
          ההצפנה. אידמפוטנטי: ערך שכבר מוצפן מדולג, ולכן הרצה חוזרת בטוחה.
        */
        [HttpPost("encrypt-existing")]
        public async Task<IActionResult> EncryptExisting()
        {
            try
            {
                var updated = await _backfill.RunAsync();
                return Ok(new { updated });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // GET: api/admin/subscriptions — מי במסלול פרו ועד מתי (ועדים וספקים)
        [HttpGet("subscriptions")]
        public async Task<ActionResult<SubscriptionsDto>> GetSubscriptions()
        {
            return Ok(await _subscriptions.GetAsync());
        }
    }
}
