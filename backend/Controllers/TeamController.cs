using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      TeamController — ניהול חברי הצוות וההרשאות (דורש token). פעולות הניהול
      (הזמנה/הסרה/שינוי הרשאה) מוגבלות ל"מנהל" בשכבת ה-Service (403 אחרת).
      פדיון הזמנה (invite/{token}) נגיש לכל משתמש מחובר — הטוקן הוא ההרשאה.
    */
    [ApiController]
    [Route("api/team")]
    public class TeamController : ControllerBase
    {
        private readonly ITeamService _team;

        public TeamController(ITeamService team)
        {
            _team = team;
        }

        /* המוסד הפעיל מכותרת X-Institution (מזהה ה-Group). */
        private int? ActiveGroupId =>
            int.TryParse(Request.Headers["X-Institution"], out var id) ? id : null;

        // GET api/team — חברי הצוות + הזמנות ממתינות של הגן הפעיל
        [HttpGet]
        public async Task<IActionResult> GetTeam()
        {
            var team = await _team.GetTeamAsync(ActiveGroupId);
            return team == null ? NotFound() : Ok(team);
        }

        // POST api/team/invites — יצירת הזמנה (מנהל)
        [HttpPost("invites")]
        public async Task<IActionResult> CreateInvite([FromBody] InviteCreateDto dto)
        {
            var invite = await _team.CreateInviteAsync(ActiveGroupId, dto);
            return invite == null ? NotFound() : Ok(invite);
        }

        // DELETE api/team/invites/1 — ביטול הזמנה ממתינה (מנהל)
        [HttpDelete("invites/{id}")]
        public async Task<IActionResult> CancelInvite(int id)
        {
            return await _team.CancelInviteAsync(ActiveGroupId, id)
                ? NoContent()
                : NotFound();
        }

        // DELETE api/team/members/1 — הסרת חבר צוות (מנהל)
        [HttpDelete("members/{id}")]
        public async Task<IActionResult> RemoveMember(int id)
        {
            return await _team.RemoveMemberAsync(ActiveGroupId, id)
                ? NoContent()
                : NotFound();
        }

        // PUT api/team/members/1 — שינוי הרשאת חבר צוות (מנהל)
        [HttpPut("members/{id}")]
        public async Task<IActionResult> UpdateMemberRole(int id, [FromBody] RoleUpdateDto dto)
        {
            return await _team.UpdateMemberRoleAsync(ActiveGroupId, id, dto.Role)
                ? NoContent()
                : NotFound();
        }

        // GET api/team/invite/{token} — תצוגה מקדימה של הזמנה (עמוד ההצטרפות)
        [HttpGet("invite/{token}")]
        public async Task<IActionResult> Preview(string token)
        {
            var preview = await _team.PreviewInviteAsync(token);
            return preview == null
                ? NotFound(new { message = "ההזמנה לא נמצאה או שכבר נוצלה" })
                : Ok(preview);
        }

        // POST api/team/invite/{token}/accept — המשתמש המחובר מצטרף לגן
        [HttpPost("invite/{token}/accept")]
        public async Task<IActionResult> Accept(string token)
        {
            var result = await _team.AcceptInviteAsync(token);
            return result == null
                ? NotFound(new { message = "ההזמנה לא נמצאה או שכבר נוצלה" })
                : Ok(result);
        }
    }
}
