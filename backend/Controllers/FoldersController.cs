using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      FoldersController — קונטרולר דק לקישורי תיקיות Drive (UI_SPEC ס' 13).
      נתיב: api/folders. כל הלוגיקה ב-IDriveFolderService.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class FoldersController : ControllerBase
    {
        private readonly IDriveFolderService _folderService;

        public FoldersController(IDriveFolderService folderService)
        {
            _folderService = folderService;
        }

        // GET: api/folders
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DriveFolderResponseDto>>> GetAllFolders()
        {
            return Ok(await _folderService.GetAllAsync());
        }

        // GET: api/folders/1
        [HttpGet("{id}")]
        public async Task<ActionResult<DriveFolderResponseDto>> GetFolder(int id)
        {
            var folder = await _folderService.GetByIdAsync(id);
            if (folder == null)
                return NotFound(new { message = "תיקייה לא נמצאה" });
            return Ok(folder);
        }

        // POST: api/folders
        [HttpPost]
        public async Task<ActionResult<DriveFolderResponseDto>> CreateFolder([FromBody] DriveFolderCreateDto dto)
        {
            var created = await _folderService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetFolder), new { id = created.Id }, created);
        }

        // PUT: api/folders/1
        [HttpPut("{id}")]
        public async Task<ActionResult<DriveFolderResponseDto>> UpdateFolder(int id, [FromBody] DriveFolderUpdateDto dto)
        {
            var updated = await _folderService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "תיקייה לא נמצאה" });
            return Ok(updated);
        }

        // DELETE: api/folders/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFolder(int id)
        {
            var deleted = await _folderService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "תיקייה לא נמצאה" });
            return NoContent();
        }
    }
}
