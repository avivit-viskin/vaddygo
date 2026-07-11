using ParentCommitteeAPI.DTOs;

namespace ParentCommitteeAPI.Services
{
    /*
      IStudentService — חוזה הלוגיקה העסקית של תלמידים (BL).
      ה-Controller מדבר רק איתו — לעולם לא עם המסד ישירות.
    */
    public interface IStudentService
    {
        // groupId = המוסד הפעיל (מכותרת X-Institution). null = בלי סינון (תאימות לאחור).
        Task<List<StudentResponseDto>> GetAllAsync(int? groupId = null);
        Task<StudentResponseDto?> GetByIdAsync(int id);
        Task<StudentResponseDto> CreateAsync(StudentCreateDto dto, int? groupId = null);
        Task<StudentResponseDto?> UpdateAsync(int id, StudentUpdateDto dto);
        Task<bool> DeleteAsync(int id);
    }
}
