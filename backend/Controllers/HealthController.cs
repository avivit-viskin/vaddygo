using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ParentCommitteeAPI;

namespace ParentCommitteeAPI.Controllers
{
    /*
      HealthController — בדיקת בריאות לניטור ולפריסה (Railway).
      פתוח ללא הזדהות (AllowAnonymous) — אחרת ה-FallbackPolicy משלב 10 היה
      מחזיר 401 לבודק הבריאות של הפלטפורמה. מחזיר 200 כשהשרת והמסד זמינים,
      ו-503 אם אין גישה למסד — כך Railway יודע לא לנתב תעבורה לשרת חולה.
    */
    [ApiController]
    [Route("api/health")]
    [AllowAnonymous]
    public class HealthController : ControllerBase
    {
        private readonly AppDbContext _db;

        public HealthController(AppDbContext db)
        {
            _db = db;
        }

        // GET: api/health
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var databaseOk = await _db.Database.CanConnectAsync();
            if (!databaseOk)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable,
                    new { status = "degraded", database = "unavailable" });
            }

            return Ok(new
            {
                status = "ok",
                database = "ok",
                time = DateTime.UtcNow,
            });
        }
    }
}
