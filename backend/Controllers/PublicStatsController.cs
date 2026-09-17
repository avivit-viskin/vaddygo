using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      PublicStatsController — מדדים ציבוריים לתצוגה (ללא הזדהות): מספר הוועדים
      הרשומים במערכת. מוצג בפורטל הספקים כתמריץ ("כבר X ועדים ב-VaddyGo"),
      ולכן חשוף בכוונה. מחזיר מספר אחד בלבד — בלי שום פרט מזהה על אף מוסד.
    */
    [ApiController]
    [Route("api/public/stats")]
    [AllowAnonymous]
    [EnableRateLimiting(RateLimitPolicies.Public)]
    public class PublicStatsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PublicStatsController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/public/stats/committee-count — כמה ועדים (מוסדות) רשומים כרגע
        [HttpGet("committee-count")]
        public async Task<ActionResult<object>> CommitteeCount()
        {
            var count = await _db.Groups.CountAsync();
            return Ok(new { count });
        }
    }
}
