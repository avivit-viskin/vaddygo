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
        private readonly IAccountService _account;

        public AdminController(
            IUsageStatsService usageStats,
            ISubscriptionsService subscriptions,
            ISecurityStatusService security,
            IEncryptionBackfillService backfill,
            IAccountService account)
        {
            _usageStats = usageStats;
            _subscriptions = subscriptions;
            _security = security;
            _backfill = backfill;
            _account = account;
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

        /*
          DELETE: api/admin/committees/{groupId} — מחיקת גן (ניקוי גני-בדיקה).
          בטוח: מוחק רק גן יחיד של חשבון רגיל; מסרב לחשבון מנהלת או לחשבון עם
          כמה גנים, כדי לא לנעול את המנהלת ולא למחוק גן אמיתי בטעות.
        */
        [HttpDelete("committees/{groupId:int}")]
        public async Task<IActionResult> DeleteCommittee(int groupId)
        {
            var result = await _account.DeleteCommitteeAsync(groupId);
            return result switch
            {
                CommitteeDeleteResult.Deleted => Ok(new { message = "הגן נמחק" }),
                CommitteeDeleteResult.NotFound =>
                    NotFound(new { message = "הגן לא נמצא (אולי כבר נמחק)" }),
                CommitteeDeleteResult.ProtectedAdmin =>
                    BadRequest(new { message = "לא ניתן למחוק גן של חשבון מנהלת" }),
                CommitteeDeleteResult.HasMultiple =>
                    BadRequest(new
                    {
                        message = "לחשבון הזה יש כמה גנים — לא ניתן למחוק אותו מכאן"
                    }),
                _ => BadRequest(new { message = "המחיקה נכשלה" }),
            };
        }
    }
}
