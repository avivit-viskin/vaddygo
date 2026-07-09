using ParentCommitteeAPI.DTOs;
using ParentCommitteeAPI.Models;
using ParentCommitteeAPI.Repositories;

namespace ParentCommitteeAPI.Services
{
    /*
      StudentService — הלוגיקה העסקית של תלמידים:
      מיפוי DTO ↔ מודל, ניקוי קלט (רווחים, נרמול טלפון),
      חישוב סך התשלומים ששולמו לכל תלמיד,
      ולוגים בלי מידע רגיש — מזהים בלבד, לא שמות ולא טלפונים.
    */
    public class StudentService : IStudentService
    {
        private readonly IRepository<Student> _students;
        private readonly IRepository<Payment> _payments;
        private readonly ILogger<StudentService> _logger;

        public StudentService(
            IRepository<Student> students,
            IRepository<Payment> payments,
            ILogger<StudentService> logger)
        {
            _students = students;
            _payments = payments;
            _logger = logger;
        }

        public async Task<List<StudentResponseDto>> GetAllAsync()
        {
            var students = await _students.GetAllAsync();
            var paidByStudent = await GetPaidByStudentAsync();
            return students
                .Select(s => ToResponse(s, paidByStudent.GetValueOrDefault(s.Id)))
                .ToList();
        }

        public async Task<StudentResponseDto?> GetByIdAsync(int id)
        {
            var student = await _students.GetByIdAsync(id);
            if (student == null)
            {
                return null;
            }

            var paidByStudent = await GetPaidByStudentAsync();
            return ToResponse(student, paidByStudent.GetValueOrDefault(id));
        }

        public async Task<StudentResponseDto> CreateAsync(StudentCreateDto dto)
        {
            var student = new Student();
            ApplyWrite(student, dto);
            await _students.AddAsync(student);
            _logger.LogInformation("Student created (Id: {StudentId})", student.Id);
            return ToResponse(student, 0m);
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

            var paidByStudent = await GetPaidByStudentAsync();
            return ToResponse(student, paidByStudent.GetValueOrDefault(id));
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

        /* סך התשלומים ששולמו (IsPaid) לכל תלמיד — שאילתה אחת, קיבוץ לפי תלמיד. */
        private async Task<Dictionary<int, decimal>> GetPaidByStudentAsync()
        {
            var payments = await _payments.GetAllAsync();
            return payments
                .Where(p => p.IsPaid)
                .GroupBy(p => p.StudentId)
                .ToDictionary(g => g.Key, g => g.Sum(p => p.BitAmount + p.PayBoxAmount + p.CashAmount));
        }

        /* מיפוי משותף ל-Create ול-Update: ניקוי רווחים ושמירת טלפון בלי מקף. */
        private static void ApplyWrite(Student student, StudentWriteDto dto)
        {
            student.FirstName = dto.FirstName.Trim();
            student.LastName = dto.LastName.Trim();
            student.ParentName = dto.ParentName.Trim();
            student.ClassName = dto.ClassName.Trim();
            student.ParentPhoneNumber = dto.ParentPhoneNumber.Trim().Replace("-", "");
            student.BirthDate = dto.BirthDate;
        }

        private static StudentResponseDto ToResponse(Student student, decimal totalPaid) => new()
        {
            Id = student.Id,
            FirstName = student.FirstName,
            LastName = student.LastName,
            ParentName = student.ParentName,
            ClassName = student.ClassName,
            ParentPhoneNumber = student.ParentPhoneNumber,
            BirthDate = student.BirthDate,
            TotalPaid = totalPaid,
        };
    }
}
