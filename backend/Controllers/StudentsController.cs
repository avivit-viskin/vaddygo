using Microsoft.AspNetCore.Authorization;
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

        /* המוסד הפעיל שהלקוח שולח בכותרת X-Institution (מזהה ה-Group). null = בלי סינון. */
        private int? ActiveGroupId =>
            int.TryParse(Request.Headers["X-Institution"], out var id) ? id : null;

        // GET: api/students
        [HttpGet]
        public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetAllStudents()
        {
            return Ok(await _studentService.GetAllAsync(ActiveGroupId));
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
            var created = await _studentService.CreateAsync(dto, ActiveGroupId);
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

        /*
          POST: api/students/decrypt — פענוח קובץ Excel נעול בסיסמה (משימת ייבוא
          תלמידים). הלקוח שולח את הקובץ המוצפן ואת הסיסמה; אנחנו מפענחים בשרת עם
          NPOI ומחזירים את ה-xlsx הפתוח, כדי שהלקוח יקרא אותו כרגיל. הפענוח נעשה
          בשרת בכוונה — ספריית פענוח בצד הלקוח הפילה את האפליקציה. סיסמה שגויה →
          400 עם code=WRONG_PASSWORD כדי שהמסך יבקש להקליד שוב.
        */
        [Authorize]
        [HttpPost("decrypt")]
        [RequestSizeLimit(20_000_000)] // עד ~20MB — קובץ תלמידים סביר
        public async Task<IActionResult> DecryptFile(IFormFile? file, [FromForm] string? password)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "לא נבחר קובץ" });

            using var input = new MemoryStream();
            await file.CopyToAsync(input);

            byte[]? decrypted;
            try
            {
                decrypted = OfficeDecryptor.Decrypt(input.ToArray(), password ?? string.Empty);
            }
            catch
            {
                // הקובץ אינו מוצפן בפורמט Agile מוכר, או פגום — בלי חשיפת פרטים פנימיים
                return BadRequest(new { code = "DECRYPT_FAILED", message = "לא הצלחנו לפענח את הקובץ" });
            }

            if (decrypted == null)
                return BadRequest(new { code = "WRONG_PASSWORD", message = "הסיסמה שגויה" });

            return File(
                decrypted,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "decrypted.xlsx");
        }
    }
}
