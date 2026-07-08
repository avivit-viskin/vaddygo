using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;
using ParentCommitteeAPI.Repositories;

namespace ParentCommitteeAPI.Services
{
    /*
      StudentService — הלוגיקה העסקית של תלמידים:
      מיפוי DTO ↔ מודל, ניקוי קלט (רווחים, נרמול טלפון),
      ולוגים בלי מידע רגיש — מזהים בלבד, לא שמות ולא טלפונים.
    */
    public class StudentService : IStudentService
    {
        private readonly IRepository<Student> _students;
        private readonly ILogger<StudentService> _logger;

        public StudentService(IRepository<Student> students, ILogger<StudentService> logger)
        {
            _students = students;
            _logger = logger;
        }

        public async Task<List<StudentResponseDto>> GetAllAsync()
        {
            var students = await _students.GetAllAsync();
            return students.Select(ToResponse).ToList();
        }

        public async Task<StudentResponseDto?> GetByIdAsync(int id)
        {
            var student = await _students.GetByIdAsync(id);
            return student == null ? null : ToResponse(student);
        }

        public async Task<StudentResponseDto> CreateAsync(StudentCreateDto dto)
        {
            var student = new Student();
            ApplyWrite(student, dto);
            await _students.AddAsync(student);
            _logger.LogInformation("Student created (Id: {StudentId})", student.Id);
            return ToResponse(student);
        }

        public async Task<StudentResponseDto?> UpdateAsync(int id, StudentUpdateDto dto)
        {
            var student = await _students.GetByIdAsync(id);
            if (student == null)
            {
                return null;
            }

            ApplyWrite(student, dto);
            await _students.UpdateAsync(student);
            _logger.LogInformation("Student updated (Id: {StudentId})", id);
            return ToResponse(student);
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var student = await _students.GetByIdAsync(id);
            if (student == null)
            {
                return false;
            }

            await _students.DeleteAsync(student);
            _logger.LogInformation("Student deleted (Id: {StudentId})", id);
            return true;
        }

        /* מיפוי משותף ל-Create ול-Update: ניקוי רווחים ושמירת טלפון בלי מקף. */
        private static void ApplyWrite(Student student, StudentWriteDto dto)
        {
            student.FirstName = dto.FirstName.Trim();
            student.LastName = dto.LastName.Trim();
            student.ClassName = dto.ClassName.Trim();
            student.ParentPhoneNumber = dto.ParentPhoneNumber.Trim().Replace("-", "");
        }

        private static StudentResponseDto ToResponse(Student student) => new()
        {
            Id = student.Id,
            FirstName = student.FirstName,
            LastName = student.LastName,
            ClassName = student.ClassName,
            ParentPhoneNumber = student.ParentPhoneNumber,
        };
    }
}
