using Microsoft.AspNetCore.Mvc;
using ParentCommitteeAPI.Models;

namespace ParentCommitteeAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StudentsController : ControllerBase
    {
        // נתונים דמיוניים (אחרי זה נוסיף database)
        private static List<Student> students = new List<Student>
        {
            new Student { Id = 1, FirstName = "דוד", LastName = "כהן", ParentPhoneNumber = "0501234567", Grade = 3, ClassName = "ג1" },
            new Student { Id = 2, FirstName = "מרים", LastName = "לוי", ParentPhoneNumber = "0502345678", Grade = 4, ClassName = "ד1" },
            new Student { Id = 3, FirstName = "יוסף", LastName = "גולדמן", ParentPhoneNumber = "0503456789", Grade = 3, ClassName = "ג2" }
        };

        // GET: api/students
        [HttpGet]
        public ActionResult<IEnumerable<Student>> GetAllStudents()
        {
            return Ok(students);
        }

        // GET: api/students/1
        [HttpGet("{id}")]
        public ActionResult<Student> GetStudent(int id)
        {
            var student = students.FirstOrDefault(s => s.Id == id);
            if (student == null)
                return NotFound("תלמיד לא נמצא");
            return Ok(student);
        }

        // POST: api/students
        [HttpPost]
        public ActionResult<Student> CreateStudent([FromBody] Student student)
        {
            student.Id = students.Max(s => s.Id) + 1;
            students.Add(student);
            return CreatedAtAction(nameof(GetStudent), new { id = student.Id }, student);
        }

        // PUT: api/students/1
        [HttpPut("{id}")]
        public IActionResult UpdateStudent(int id, [FromBody] Student updatedStudent)
        {
            var student = students.FirstOrDefault(s => s.Id == id);
            if (student == null)
                return NotFound("תלמיד לא נמצא");

            student.FirstName = updatedStudent.FirstName;
            student.LastName = updatedStudent.LastName;
            student.ParentPhoneNumber = updatedStudent.ParentPhoneNumber;
            student.Grade = updatedStudent.Grade;
            student.ClassName = updatedStudent.ClassName;

            return Ok(student);
        }

        // DELETE: api/students/1
        [HttpDelete("{id}")]
        public IActionResult DeleteStudent(int id)
        {
            var student = students.FirstOrDefault(s => s.Id == id);
            if (student == null)
                return NotFound("תלמיד לא נמצא");

            students.Remove(student);
            return Ok("תלמיד נמחק בהצלחה");
        }
    }
}