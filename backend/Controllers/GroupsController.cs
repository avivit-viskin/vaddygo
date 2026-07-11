using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      GroupsController — קונטרולר דק: מקבל בקשה, מעביר ל-IGroupService, מחזיר תשובה.
      משרת את אשף ההרשמה (UI_SPEC ס' 3-6).
    */
    [ApiController]
    [Route("api/[controller]")]
    public class GroupsController : ControllerBase
    {
        private readonly IGroupService _groupService;

        public GroupsController(IGroupService groupService)
        {
            _groupService = groupService;
        }

        // GET: api/groups
        [HttpGet]
        public async Task<ActionResult<IEnumerable<GroupResponseDto>>> GetAllGroups()
        {
            return Ok(await _groupService.GetAllAsync());
        }

        // GET: api/groups/1
        [HttpGet("{id}")]
        public async Task<ActionResult<GroupResponseDto>> GetGroup(int id)
        {
            var group = await _groupService.GetByIdAsync(id);
            if (group == null)
                return NotFound(new { message = "גן לא נמצא" });
            return Ok(group);
        }

        // POST: api/groups
        [HttpPost]
        public async Task<ActionResult<GroupResponseDto>> CreateGroup([FromBody] GroupCreateDto dto)
        {
            var created = await _groupService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetGroup), new { id = created.Id }, created);
        }

        // PUT: api/groups/1/payment-links — עדכון קישורי הביט/פייבוקס של הוועד
        [HttpPut("{id}/payment-links")]
        public async Task<ActionResult<GroupResponseDto>> UpdatePaymentLinks(
            int id, [FromBody] GroupPaymentLinksDto dto)
        {
            var updated = await _groupService.UpdatePaymentLinksAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "גן לא נמצא" });
            return Ok(updated);
        }

        // PUT: api/groups/1/categories — עדכון קטגוריות הגבייה (מסך "עריכת גבייה")
        [HttpPut("{id}/categories")]
        public async Task<ActionResult<GroupResponseDto>> UpdateCategories(
            int id, [FromBody] GroupCategoriesUpdateDto dto)
        {
            var updated = await _groupService.UpdateCategoriesAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "גן לא נמצא" });
            return Ok(updated);
        }
    }
}
