using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IStudentService — חוזה הלוגיקה העסקית של תלמידים (BL).
      ה-Controller מדבר רק איתו — לעולם לא עם המסד ישירות.
    */
    public interface IStudentService
    {
        Task<List<StudentResponseDto>> GetAllAsync();
        Task<StudentResponseDto?> GetByIdAsync(int id);
        Task<StudentResponseDto> CreateAsync(StudentCreateDto dto);
        Task<StudentResponseDto?> UpdateAsync(int id, StudentUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
