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
        private readonly IProActivationService _proActivation;
        private readonly IBroadcastService _broadcast;

        public AdminController(
            IUsageStatsService usageStats,
            ISubscriptionsService subscriptions,
            ISecurityStatusService security,
            IEncryptionBackfillService backfill,
            IAccountService account,
            IProActivationService proActivation,
            IBroadcastService broadcast)
        {
            _usageStats = usageStats;
            _subscriptions = subscriptions;
            _security = security;
            _backfill = backfill;
            _account = account;
            _proActivation = proActivation;
            _broadcast = broadcast;
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
          GET: api/admin/broadcast/recipients — כמה בעלי מוסדות יקבלו את
          ההודעה. מוצג לפני השליחה, כדי שהאישור יהיה מודע ולא "שלח לכולם"
          בלי לדעת לכמה.
        */
        [HttpGet("broadcast/recipients")]
        public async Task<IActionResult> BroadcastRecipients([FromQuery] string? audience)
        {
            return Ok(new { count = await _broadcast.CountRecipientsAsync(audience ?? "owners") });
        }

        /*
          POST: api/admin/broadcast — שליחת עדכון לכל בעלי המוסדות במייל.

          קיים כי לא הייתה שום דרך להודיע לוועדים על שינוי (מבצע, מדיניות)
          חוץ מהעתקה ידנית לכל אחד. הנוסח מגיע מהמסך ולא מקובע כאן, כדי
          שעדכון חדש לא ידרוש פריסה.
        */
        [HttpPost("broadcast")]
        public async Task<ActionResult<BroadcastResultDto>> Broadcast(
            [FromBody] BroadcastDto dto)
        {
            var result = await _broadcast.SendAsync(
                dto.Audience ?? "owners", dto.Subject.Trim(), dto.Body.Trim());
            return Ok(result);
        }

        /*
          PUT: api/admin/committees/{groupId}/pro — פתיחה/סגירה ידנית של מסלול
          פרו לגן, ממסך המנויים של המנהלת.

          קיים כי עד היום פרו לוועד נפתח **רק** אוטומטית אחרי תשלום (webhook
          מ-GROW). לא הייתה שום דרך לתת מסלול ידנית — למשל לגן פיילוט, ללקוחה
          שמשלמת בהעברה, או כדי לבדוק פיצ'ר. הפעולה עוברת דרך אותו שירות
          שמפעיל אחרי תשלום, כדי שלא יהיו שני מסלולי הפעלה שמתנהגים שונה.

          ההפעלה הידנית היא **לגן יחיד** (לפי groupId) ולא לפי מייל: לחשבון
          אחד יכולים להיות כמה גנים, ופרו הוא per-gan.
        */
        [HttpPut("committees/{groupId:int}/pro")]
        public async Task<IActionResult> SetCommitteePro(
            int groupId, [FromBody] SetCommitteeProDto dto)
        {
            if (!dto.IsPro)
            {
                var off = await _proActivation.DeactivateCommitteeAsync(groupId);
                return off
                    ? Ok(new { message = "מסלול פרו נסגר לגן" })
                    : NotFound(new { message = "הגן לא נמצא" });
            }

            // ברירת מחדל: שנה, כמו מנוי בתשלום.
            var months = dto.Months is > 0 and <= 120 ? dto.Months!.Value : 12;
            var until = DateTime.UtcNow.Date.AddMonths(months);
            var on = await _proActivation.ActivateCommitteeAsync(groupId, null, until);
            return on
                ? Ok(new { message = $"מסלול פרו נפתח לגן עד {until:dd/MM/yyyy}", validUntil = until })
                : NotFound(new { message = "הגן לא נמצא" });
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

        /*
          DELETE: api/admin/users/{userId} — מחיקת "נרשם שלא השלים" (משתמש ללא
          ועד), לניקוי חשבונות-בדיקה שנעצרו באמצע ההרשמה. בטוח: מסרב לחשבון
          מנהלת ולמשתמש שיש לו ועד (את אלה מוחקים דרך מחיקת הגן).
        */
        [HttpDelete("users/{userId:int}")]
        public async Task<IActionResult> DeleteIncompleteUser(int userId)
        {
            var result = await _account.DeleteIncompleteUserAsync(userId);
            return result switch
            {
                IncompleteUserDeleteResult.Deleted => Ok(new { message = "הנרשם נמחק" }),
                IncompleteUserDeleteResult.NotFound =>
                    NotFound(new { message = "המשתמש לא נמצא (אולי כבר נמחק)" }),
                IncompleteUserDeleteResult.ProtectedAdmin =>
                    BadRequest(new { message = "לא ניתן למחוק חשבון מנהלת" }),
                IncompleteUserDeleteResult.HasGroup =>
                    BadRequest(new
                    {
                        message = "למשתמש הזה יש ועד — יש למחוק אותו ממחיקת הגן"
                    }),
                _ => BadRequest(new { message = "המחיקה נכשלה" }),
            };
        }
    }
}
