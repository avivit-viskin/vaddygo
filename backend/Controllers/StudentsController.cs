using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Services;

namespace ParentCommitteeAPI.Controllers
{
    /*
      StudentsController — קונטרולר דק בלבד: מקבל בקשה, מעביר ל-Service, מחזיר תשובה.
      הלוגיקה העסקית ב-IStudentService; הוולידציה מה-DTOs רצה אוטומטית ([ApiController])
      ומחזירה 400 עם הודעות בעברית עוד לפני שהקוד כאן רץ.
    */
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        private readonly IStudentService _studentService;

        public StudentsController(IStudentService studentService)
        {
            _studentService = studentService;
        }

        // GET: api/students
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetAllStudents()
        {
            return Ok(await _studentService.GetAllAsync());
        }

        // GET: api/students/1
        [HttpGet("{id}")]
        public async Task<ActionResult<StudentResponseDto>> GetStudent(int id)
        {
            var student = await _studentService.GetByIdAsync(id);
            if (student == null)
                return NotFound(new { message = "תלמיד לא נמצא" });
            return Ok(student);
        }

        // POST: api/students
        [HttpPost]
        public async Task<ActionResult<StudentResponseDto>> CreateStudent([FromBody] StudentCreateDto dto)
        {
            var created = await _studentService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetStudent), new { id = created.Id }, created);
        }

        // PUT: api/students/1
        [HttpPut("{id}")]
        public async Task<ActionResult<StudentResponseDto>> UpdateStudent(int id, [FromBody] StudentUpdateDto dto)
        {
            var updated = await _studentService.UpdateAsync(id, dto);
            if (updated == null)
                return NotFound(new { message = "תלמיד לא נמצא" });
            return Ok(updated);
        }

        // DELETE: api/students/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStudent(int id)
        {
            var deleted = await _studentService.DeleteAsync(id);
            if (!deleted)
                return NotFound(new { message = "תלמיד לא נמצא" });
            return NoContent();
        }
    }
}
