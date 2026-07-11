using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      StaffController — קונטרולר דק לאנשי צוות (UI_SPEC ס' 8: הוספה, עריכה, רשימה).
      הוולידציה מה-DTOs רצה אוטומטית ([ApiController]) ומחזירה 400 בעברית.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class StaffController : ControllerBase
    {
        private readonly IStaffService _staffService;

        public StaffController(IStaffService staffService)
        {
            _staffService = staffService;
        }

        /* המוסד הפעיל שהלקוח שולח בכותרת X-Institution (מזהה ה-Group). null = בלי סינון. */
        private int? ActiveGroupId =>
            int.TryParse(Request.Headers["X-Institution"], out var id) ? id : null;

        // GET: api/staff
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StaffMemberResponseDto>>> GetAllStaff()
        {
            return Ok(await _staffService.GetAllAsync(ActiveGroupId));
        }

        // GET: api/staff/1
        [HttpGet("{id}")]
        public async Task<ActionResult<StaffMemberResponseDto>> GetStaffMember(int id)
        {
            var member = await _staffService.GetByIdAsync(id);
            if (member == null)
                return NotFound(new { message = "איש הצוות לא נמצא" });
            return Ok(member);
        }

        // POST: api/staff
        [HttpPost]
        public async Task<ActionResult<StaffMemberResponseDto>> CreateStaffMember([FromBody] StaffMemberCreateDto dto)
        {
            var created = await _staffService.CreateAsync(dto, ActiveGroupId);
            return CreatedAtAction(nameof(GetStaffMember), new { id = created.Id }, created);
        }

        // PUT: api/staff/1
        [HttpPut("{id}")]
        public async Task<ActionResult<StaffMemberResponseDto>> UpdateStaffMember(int id, [FromBody] StaffMemberUpdateDto dto)
        {
            var updated = await _staffService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "איש הצוות לא נמצא" });
            return Ok(updated);
        }

        // DELETE: api/staff/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStaffMember(int id)
        {
            var deleted = await _staffService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "איש הצוות לא נמצא" });
            return NoContent();
        }
    }
}
